import type { Book } from "./types";

type Source = { label: string; url: string };
type Editorial = {
  author: string;
  synopsis: string;
  source: Source;
  editionNote?: string;
  profile?: { text: string; source: Source };
  rating?: {
    value: number;
    count: number;
    countLabel: string;
    edition: string;
    source: Source;
  };
};
export const CONTENT_RETRIEVED = "15 October 2026";
// Short editorial paraphrases. Ratings are indexed source snapshots, not live scores.
const editorial: Record<string, Editorial> = {
  jelik: {
    author: "Ismi Fa Ismail",
    synopsis:
      "Kembar Adam dan Muhammad menyertai dua sahabat untuk merakam dokumentari tentang Kubur Terapung. Kunjungan ke Kampung Gerbang Pusara bertukar menjadi misteri apabila kedua-duanya hilang dari khemah pada waktu malam.",
    source: {
      label: "Google Play Books · Buku Fixi",
      url: "https://play.google.com/store/books/details/JELIK?hl=en&id=xkrYEAAAQBAJ",
    },
    rating: {
      value: 4.25,
      count: 289,
      countLabel: "ratings",
      edition: "Original novel",
      source: {
        label: "Goodreads",
        url: "https://www.goodreads.com/id/book/show/199064020",
      },
    },
  },
  renjana: {
    author: "Qiydenneskala",
    synopsis:
      "Di Pulau Suna’a, Zafran dan Dilara bertemu semula dengan sahabat yang menyimpan dendam. Pertembungan masa silam dan masa kini membongkar cinta berabad lamanya, perebutan kuasa dan pengkhianatan yang mengancam nyawa.",
    source: {
      label: "Bookcafe",
      url: "https://www.bookcafe.my/products/renjana-qiydenneskala",
    },
    rating: {
      value: 3.41,
      count: 37,
      countLabel: "ratings",
      edition: "Original novel",
      source: {
        label: "Goodreads",
        url: "https://www.goodreads.com/book/show/240367725-renjana",
      },
    },
  },
  amuk: {
    author: "Khairi Mohd",
    synopsis:
      "Pertemuan dengan seorang jurnalis membawa Zairi kembali kepada kenangan kampung dan cintanya terhadap Maisara. Namun, rahsia serta ancaman ilmu hitam menguji kemampuannya melindungi orang yang disayangi. Sambungan kepada Telaga.",
    source: {
      label: "Bookcafe",
      url: "https://bookcafe.easy.co/products/amuk",
    },
    profile: {
      text: "Khairi Mohd menulis fantasi dan thriller. Karya awalnya diterbitkan menggunakan nama pena Xarine, sebelum beliau turut menulis untuk Buku Fixi.",
      source: {
        label: "Goodreads author biography",
        url: "https://www.goodreads.com/en/book/show/212162270-amuk",
      },
    },
    rating: {
      value: 4.32,
      count: 123,
      countLabel: "ratings",
      edition: "Original novel",
      source: {
        label: "Goodreads",
        url: "https://www.goodreads.com/en/book/show/212162270-amuk",
      },
    },
  },
  jelaga: {
    author: "Faizal Sulaiman",
    synopsis:
      "Sungai Gelumbang menyimpan ancaman yang memanggil pewarisnya kembali. Di Kampung Permai, cermin, kalung dan bisikan misteri membawa petanda bahawa sesuatu yang lama terpendam kini menuntut balasan.",
    source: {
      label: "Gerakbudaya",
      url: "https://www.gerakbudaya.com/product/jelaga",
    },
    profile: {
      text: "Faizal Sulaiman dilahirkan di Batu Pahat dan membesar di Kota Tinggi, Johor. Beliau mula menulis ketika bersekolah; Sumbat ialah novel pertamanya.",
      source: {
        label: "Goodreads author biography",
        url: "https://www.goodreads.com/en/book/show/243384026-jelaga",
      },
    },
  },
  "gantung-3": {
    author: "Nadia Khan",
    synopsis:
      "Menjelang usia 40 tahun, Ray mula membandingkan hidupnya dengan kejayaan sahabat-sahabatnya. Pertemuan semula di SMCGT menghidupkan semangat baharu, tetapi usahanya untuk melangkah ke hadapan berdepan halangan yang sukar dijelaskan.",
    source: {
      label: "Gerakbudaya",
      url: "https://www.gerakbudaya.com/product/gantung-3-nadia-khan-fixi",
    },
    profile: {
      text: "Nadia Khan ialah penulis dan pembikin filem Malaysia. Novel pertamanya, Kelabu, diterbitkan pada 2011, diikuti antaranya oleh Cerpen dan Gantung. Beliau turut menulis skrip televisyen dan filem.",
      source: {
        label: "Goodreads author profile",
        url: "https://www.goodreads.com/author/show/1834594.Nadia_Khan",
      },
    },
  },
  motel: {
    author: "Sahidzan Salleh",
    synopsis:
      "Seorang bekas banduan, dua sahabat yang mengejar kekayaan, penuntut hutang, pembunuh upahan dan penyiasat kehilangan penulis bergerak menuju destinasi yang sama. Sebuah motel terpencil mempertemukan misi mereka dengan rahsia yang tersembunyi.",
    source: {
      label: "Goodreads book listing",
      url: "https://www.goodreads.com/book/show/212162589-motel",
    },
    rating: {
      value: 4.03,
      count: 90,
      countLabel: "ratings",
      edition: "Original novel",
      source: {
        label: "Goodreads",
        url: "https://www.goodreads.com/book/show/212162589-motel",
      },
    },
  },
  "kacau-movie-tie-in": {
    author: "Ariff Adly",
    synopsis:
      "Sekumpulan sahabat yang gemar meneroka lokasi berhantu mencuba permainan Spirit of the Coin di sebuah bangunan terbiar. Selepas itu, gangguan mengekori mereka, mengubah pencarian keseronokan menjadi perjuangan untuk terus hidup.",
    source: {
      label: "B.U.K.U itu · review of the original novel",
      url: "https://ceritabuku78.blogspot.com/2014/04/kacau.html",
    },
    editionNote:
      "Synopsis of the original KACAU novel; the movie tie-in edition is forthcoming.",
    profile: {
      text: "Ariff Adly berasal dari Johor dan juga dikenali sebagai Kidd. Beliau mempunyai latar pengajian pembangunan perisian. KACAU, novel pertamanya, diterbitkan pada 2014.",
      source: {
        label: "Google Play Books · author biography",
        url: "https://play.google.com/store/books/details/Ariff_Adly_KACAU?id=htDhAgAAQBAJ",
      },
    },
    rating: {
      value: 4.6,
      count: 694,
      countLabel: "reviews",
      edition: "Original 2014 ebook — not the movie tie-in edition",
      source: {
        label: "Google Play Books",
        url: "https://play.google.com/store/books/details/Ariff_Adly_KACAU?id=htDhAgAAQBAJ",
      },
    },
  },
};
export function bookEditorial(book: Book) {
  const entry = editorial[book.slug];
  return book.provenance === "public_metadata" && entry?.author === book.author
    ? entry
    : undefined;
}
export const FILM_POSTER = {
  image: "https://www.cinema.com.my/images/movies/2026/7kacau00_450.jpg",
  source:
    "https://www.cinema.com.my/movies/details.aspx?search=2026.20884.kacau.40582&title=Kacau",
};
