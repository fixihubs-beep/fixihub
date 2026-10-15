import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { initialData } from '../../lib/seed';
const projectUrl=readFileSync('.env.local','utf8').match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)![1].trim();
const authKey=`sb-${new URL(projectUrl).hostname.split('.')[0]}-auth-token`;
for (const role of ['customer','staff','admin','superadmin']) {
 test(`${role}: live workspace navigation and role boundaries`,async({page})=>{
  const user={id:'44444444-4444-4444-8444-444444444444',email:'role@example.test',aud:'authenticated',role:'authenticated',identities:[{provider:'google'}],user_metadata:{full_name:'Role Reader'},app_metadata:{provider:'google'}};
  const profile={id:user.id,email:user.email,display_name:'Role Reader',role,active:true};
  const payment={enabled:false,qr_url:'',payee:'',support:''};
  await page.route('**/auth/v1/user',r=>r.fulfill({json:user}));
  await page.route('**/api/commerce-status',r=>r.fulfill({json:{ready:false}}));
  let snapshots=0;
  await page.route('**/rest/v1/rpc/**',async r=>{
   if(r.request().url().endsWith('fixihub_feedback')) return r.fulfill({json:{id:r.request().postDataJSON().p_id}});
   if(r.request().url().endsWith('fixihub_payment_settings')) return r.fulfill({json:payment});
   snapshots++;
   return r.fulfill({json:{books:initialData.books,campaigns:initialData.campaigns.map(c=>({...c,active:false})),profile,profiles:[profile],orders:[],payments:[],events:[],payment}});
  });
  await page.addInitScript(({user,authKey})=>{const exp=Math.floor(Date.now()/1000)+3600;localStorage.setItem(authKey,JSON.stringify({access_token:btoa(JSON.stringify({alg:'HS256'}))+'.'+btoa(JSON.stringify({sub:user.id,exp}))+'.test',refresh_token:'test',expires_at:exp,token_type:'bearer',user}));},{user,authKey});
  await page.goto('/admin');
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  if(role==='customer'){
   await expect(nav.getByRole('link',{name:'Admin',exact:true})).toHaveCount(0);
   await expect(page.getByRole('heading',{name:'The publisher workspace'})).toBeVisible();
   await expect(page.getByRole('navigation',{name:'Workspace navigation'})).toHaveCount(0);
   return;
  }
  await expect(nav.getByRole('link',{name:'Admin',exact:true})).toBeVisible();
  await expect(page.locator('.workspace-mode')).toContainText('Live workspace');
  await expect(page.locator('.admin-content')).not.toContainText('Preview workspace');
  const workspace=page.getByRole('navigation',{name:'Workspace navigation'});
  await expect(workspace.getByRole('button',{name:'Catalog',exact:true})).toHaveCount(role==='staff'?0:1);
  await expect(workspace.getByRole('button',{name:'Security',exact:true})).toHaveCount(role==='superadmin'?1:0);
  if(role==='superadmin'){
   await workspace.getByRole('button',{name:'Security',exact:true}).click();
   await expect(page.getByRole('heading',{name:'Merchant QR & bank details'})).toBeVisible();
   await expect(page.getByText('Server key required', {exact:true})).toBeVisible();
   await page.getByRole('button',{name:'Send feedback or report an issue'}).click();
   await page.getByLabel('Your message').fill('The order page needs a little help.');
   await page.getByRole('button',{name:'Send feedback',exact:true}).click();
   await expect(page.getByText('Thanks. Your message has been saved.')).toBeVisible();
   await page.getByRole('button',{name:'Close dialog',exact:true}).click();
   const before=snapshots;
   await expect.poll(()=>snapshots,{timeout:20000}).toBeGreaterThan(before);
   await expect(page.locator('.admin-heading h1')).toHaveText('Security');
  }
 });
}

test('mobile guest can open feedback and is directed to Google sign-in',async({page})=>{
 await page.route('**/rest/v1/rpc/**',r=>r.fulfill({status:404,json:{code:'PGRST202'}}));
 await page.setViewportSize({width:390,height:844});
 await page.goto('/account');
 await page.getByRole('button',{name:'Send feedback or report an issue'}).click();
 await expect(page.getByRole('dialog')).toContainText('Sign in so we can connect your message');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('dialog').getByRole('link',{name:'Sign in with Google'}).click();
 await expect(page.getByRole('button',{name:'Continue with Google',exact:true})).toBeVisible();
});
