import type { GuideCategory } from "./types";

/**
 * PatiRehber bilgi bankası.
 * İçerik genel bilgilendirme amaçlıdır; hekim tavsiyesi yerine geçmez.
 */
export const guideCategories: GuideCategory[] = [
  {
    id: "nutrition",
    title: "Beslenme",
    emoji: "🍽️",
    description:
      "Yaşa uygun öğünler, mama türleri, porsiyonlar ve mama geçişi.",
    tint: "bg-primary/10 text-primary-strong",
    sections: [
      {
        id: "nutrition-age",
        title: "Yaşa göre beslenme",
        summary: "Yavru, yetişkin ve yaşlı kedilerin ihtiyaçları farklıdır.",
        blocks: [
          {
            type: "table",
            headers: ["Dönem", "Öğün sayısı", "Öneri"],
            rows: [
              ["0-4 ay (yavru)", "4 öğün", "Yavru maması, ıslatılmış kuru mamayla başlanabilir"],
              ["4-6 ay", "3-4 öğün", "Yavru maması, büyüme için yüksek protein"],
              ["6-12 ay", "3 öğün", "Yavru → yetişkin mamasına geçiş"],
              ["1-7 yaş (yetişkin)", "2-3 öğün", "Tam ve dengeli yetişkin maması"],
              ["7+ yaş (yaşlı)", "2-3 öğün", "Yaşlı maması, böbrek ve eklem desteği"],
            ],
          },
          {
            type: "p",
            text: "Kediler obur değil, alışkanlık hayvanıdır. Aynı saatlerde, aynı yerde ve temiz kapta beslemek sindirimi kolaylaştırır, stresi azaltır.",
          },
          {
            type: "tip",
            text: "Serbest besleme (mama kabını sürekli dolu tutmak) obeziteye zemin hazırlar. Öğünleri ölçerek verin; günlük miktarı kedinin kilosuna ve aktivitesine göre hesaplayın.",
          },
        ],
      },
      {
        id: "nutrition-types",
        title: "Mama türleri: kuru, yaş, tahılsız",
        summary: "Her mamayı doğru yerde ve doğru miktarda kullanın.",
        blocks: [
          {
            type: "list",
            items: [
              "Kuru mama: Diş sağlığına katkı sağlar, uzun süre bozulmaz; ancak su tüketimini desteklemek gerekir.",
              "Yaş mama: Yüksek nem oranı sayesinde su alımını artırır, iştahı açar; açıldıktan sonra buzdolabında saklanmalı ve 24 saat içinde tüketilmelidir.",
              "Tahılsız mama: Tahıl alerjisi olan kedilerde tercih edilebilir; 'tahılsız' tek başına daha sağlıklı anlamına gelmez, protein kaynağı önemlidir.",
              "Veteriner mamaları: Böbrek, diyabet, mide-bağırsak gibi tanı konmuş durumlarda hekim önerisiyle kullanılmalıdır.",
            ],
          },
          {
            type: "warn",
            text: "Mama değişikliğini ani yapmayın. Yeni mamayı 7 gün boyunca eski mamayla karıştırarak artırın; ani geçiş ishal ve kusmaya yol açabilir.",
          },
        ],
      },
      {
        id: "nutrition-transition",
        title: "Mama geçişi: 7 günlük plan",
        summary: "Sindirimi bozmadan yeni mamaya geçin.",
        blocks: [
          {
            type: "list",
            items: [
              "1-2. gün: %75 eski mama + %25 yeni mama",
              "3-4. gün: %50 eski + %50 yeni",
              "5-6. gün: %25 eski + %75 yeni",
              "7. gün: %100 yeni mama",
            ],
          },
          {
            type: "p",
            text: "Geçiş sırasında dışkı kıvamını ve iştahı gözlemleyin. İshal, kusma veya iştahsızlık olursa bir önceki adıma dönün ve gerekirse veterinerinize danışın.",
          },
        ],
      },
      {
        id: "nutrition-water",
        title: "Su tüketimi",
        summary: "Kediler az su içer; bu böbrek sağlığı için risk oluşturur.",
        blocks: [
          {
            type: "p",
            text: "Sağlıklı bir yetişkin kedi günde yaklaşık 40-60 ml/kg su almalıdır. 4 kg bir kedi için bu yaklaşık 160-240 ml'dir. Yaş mama, toplam su alımının bir kısmını karşılar.",
          },
          {
            type: "list",
            items: [
              "Geniş, seramik veya cam su kabı kullanın; plastik tat bırakabilir.",
              "Suyu günde en az bir kez tazeleyin, kabı her gün yıkayın.",
              "Su kabını mama kabından uzağa yerleştirin.",
              "Kediler akan suyu sever; kedi çeşmesi tercih edilebilir.",
            ],
          },
          {
            type: "warn",
            text: "Kedi sürekli çok su içiyorsa (polidipsi) diyabet, böbrek hastalığı veya tiroit sorunu olabilir. Bu belirtiyi hafife almayın.",
          },
        ],
      },
    ],
  },
  {
    id: "health",
    title: "Sağlık",
    emoji: "🏥",
    description: "Aşılar, parazitler, kısırlaştırma ve erken uyarı işaretleri.",
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    sections: [
      {
        id: "health-vaccines",
        title: "Aşı takvimi",
        summary: "Yavru ve yetişkin kediler için temel aşı planı.",
        blocks: [
          {
            type: "table",
            headers: ["Zaman", "Aşı", "Not"],
            rows: [
              ["6-8 hafta", "Karma 1 (FVRCP)", "İlk doz, hekim değerlendirmesiyle"],
              ["10-12 hafta", "Karma 2", "2-4 hafta ara ile"],
              ["14-16 hafta", "Karma 3 + Kuduz", "Kuduz yasal olarak zorunludur"],
              ["1 yaş", "Hatırlatma", "Karma ve kuduz rapeli"],
              ["Her 1-3 yıl", "Yetişkin rapel", "Risk durumuna göre hekim kararı"],
            ],
          },
          {
            type: "p",
            text: "İç ve dış mekân erişimi olan kedilerde lösemi (FeLV) aşısı da gerekebilir. Aşı geçmişini ve bir sonraki tarihi PatiRehber'deki kedi profiline kaydedin.",
          },
          {
            type: "tip",
            text: "Aşı öncesi kedi sağlıklı olmalıdır. Ateş, ishal veya iştahsızlık varsa randevuyu erteleyin.",
          },
        ],
      },
      {
        id: "health-parasites",
        title: "Parazit tedavisi",
        summary: "İç ve dış parazitler düzenli koruma ister.",
        blocks: [
          {
            type: "list",
            items: [
              "Dış parazit (pire, kene): Genellikle ayda 1 kez damla veya tablet.",
              "İç parazit (solucan): 3 ayda 1 kez, hekim önerisine göre.",
              "Pire ve kene ürünlerini kedi ağırlığına göre seçin; köpek ürünleri kedilere ZEHİRLİDİR.",
              "Tedaviden sonra 48 saat boyunca yalama ve banyo yapmamasına dikkat edin.",
            ],
          },
          {
            type: "warn",
            text: "Eczaneden rastgele parazit ilacı almayın. Doz aşımı titreme, salya ve nöbetlere yol açabilir. Uygulama öncesi mutlaka kilo ölçün.",
          },
        ],
      },
      {
        id: "health-neuter",
        title: "Kısırlaştırma",
        summary: "Davranış ve sağlık için en etkili korunma yöntemidir.",
        blocks: [
          {
            type: "p",
            text: "Dişi kedilerde 5-6 aylıktan itibaren, erkeklerde 6 ay civarında kısırlaştırma önerilir. Hekim, kedinin gelişimini değerlendirerek en uygun zamanı belirler.",
          },
          {
            type: "list",
            items: [
              "Dişi kedilerde meme tümörü ve rahim enfeksiyonu riskini belirgin azaltır.",
              "Erkeklerde idrar yolu tıkanıklığı ve kavga kaynaklı hastalık riskini düşürür.",
              "Kısırlaştırma sonrası metabolizma yavaşlar; porsiyonu %10-20 azaltmak gerekebilir.",
              "Ameliyat sonrası 7-10 gün hareket kısıtlaması ve yara kontrolü yapın.",
            ],
          },
        ],
      },
      {
        id: "health-signs",
        title: "Acil veteriner belirtileri",
        summary: "Bu işaretlerden biri varsa beklemeden hekime başvurun.",
        blocks: [
          {
            type: "warn",
            text: "Zorla nefes alma, morarma, nöbet, idrar yapamama, sürekli kusma, zehir yeme veya bilinç değişikliği acil durumdur. Telefonla arayıp yola çıkın.",
          },
          {
            type: "list",
            items: [
              "24 saatten fazla iştahsızlık",
              "24 saatten fazla idrara çıkmama (özellikle erkek kedilerde idrar tıkanıklığı)",
              "Sarı/mavi renkli diş eti, solgunluk",
              "Kanlı ishal veya kanlı idrar",
              "Tekrarlayan kusma ve halsizlik",
              "Ani felç, topallık veya denge kaybı",
            ],
          },
        ],
      },
      {
        id: "health-dental",
        title: "Diş ve tırnak bakımı",
        summary: "Küçük alışkanlıklar büyük sağlık sorunlarını önler.",
        blocks: [
          {
            type: "list",
            items: [
              "Dişleri haftada 2-3 kez kedi diş fırçası ve kedi diş macunuyla fırçalayın (insan macunu kullanmayın).",
              "Ağız kokusu, kırmızı diş eti ve yemek yerken ağlama diş hastalığına işaret edebilir.",
              "Tırnakları 2-3 haftada bir, damar kısmını görerek kesin; emin değilseniz veterinerden yardım alın.",
              "Tırmalama tahtası tırnak sağlığını destekler ve mobilyayı korur.",
            ],
          },
          {
            type: "tip",
            text: "Tırnak kesimini ödül ve sakin ortamla eşleştirin. Tek seansta tüm patileri kesmek zorunda değilsiniz; güven önemlidir.",
          },
        ],
      },
      {
        id: "health-weight",
        title: "Kilo kontrolü ve BCS",
        summary: "İdeal kilo, görünüşten çok dokunarak değerlendirilir.",
        blocks: [
          {
            type: "p",
            text: "Vücut Kondisyon Skoru (BCS) 1-9 arasıdır; 5 ideal, 1 aşırı zayıf, 9 aşırı obezdir. Kaburga kemiklerini hafif bastırarak hissetmek ideal, görünür şekilde belirgin olması zayıflık işaretidir.",
          },
          {
            type: "list",
            items: [
              "Yetişkin kedileri ayda en az bir kez tartın.",
              "Haftada %1-2'den fazla kilo kaybı hekime danışmayı gerektirir.",
              "Obezite diyabet, eklem sorunları ve kalp hastalığı riskini artırır.",
              "Kilo verme programı hekim gözetiminde, yavaş ve kontrollü olmalıdır.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "litter",
    title: "Tuvalet & Hijyen",
    emoji: "🚽",
    description: "Kum kabı seçimi, kum türleri, temizlik ve yerleşim.",
    tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    sections: [
      {
        id: "litter-box",
        title: "Kum kabı seçimi",
        summary: "Doğru boyut ve sayı, tuvalet sorunlarını önler.",
        blocks: [
          {
            type: "list",
            items: [
              "Kap, kedinin boyunun 1.5 katı uzunlukta olmalı; kedi rahatça dönüp eşinebilmeli.",
              "Altı kapalı (kapaklı) kutular koku ve güvenlik nedeniyle tercih edilmemelidir; en az bir açık kap sunun.",
              "Kural: kedi sayısı + 1 adet kum kabı.",
              "Yüksek kenarlı kap, kum saçılmasını azaltır; yaşlı kediler için alçak girişli alternatif sağlayın.",
            ],
          },
          {
            type: "tip",
            text: "Kediler dar, kapalı tuvaletleri sevmez. Köşeye sıkışmış hissettiren kutu, kutu dışına idrar yapma davranışının en yaygın nedenlerindendir.",
          },
        ],
      },
      {
        id: "litter-types",
        title: "Kum türleri",
        summary: "Her kumun avantajı ve dezavantajı vardır.",
        blocks: [
          {
            type: "table",
            headers: ["Kum türü", "Artı", "Eksi"],
            rows: [
              ["Bentonit (topaklanan)", "Kolay temizlik, iyi koku kontrolü", "Ağır, tozlu olabilir"],
              ["Bitkisel / mısır", "Doğada çözünür, hafif, az toz", "Topaklanma performansı değişken"],
              ["Silika jel", "Uzun süre koku tutar, az toz", "Bazı kediler tane yapısını sevmez"],
              ["Ahşap pelet", "Ekonomik, doğal, az toz", "Topaklanmaz, sık değişim gerekir"],
              ["Kağıt / geri dönüşüm", "Ameliyat sonrası ve hassas patiler için ideal", "Emiciliği düşük, sık değişir"],
            ],
          },
          {
            type: "warn",
            text: "Parfümlü kum ve koku giderici spreyler solunum yolu irritasyonuna yol açabilir. Kokuyu kapatmak yerine kaynağını temizleyin.",
          },
        ],
      },
      {
        id: "litter-clean",
        title: "Temizlik sıklığı",
        summary: "Kum temizliği pazarlık konusu değildir.",
        blocks: [
          {
            type: "list",
            items: [
              "Topaklanan kumu günde en az 2 kez tırmıkla temizleyin.",
              "Tüm kumu haftada 1 kez boşaltıp kabı sıcak sabunlu suyla yıkayın, iyice durulayın.",
              "Plastik kap yıpranınca (çizikler bakteri tutar) 6-12 ayda bir yenileyin.",
              "Kum seviyesi 5-7 cm olmalı; çok az kum kazmayı engeller.",
            ],
          },
          {
            type: "tip",
            text: "Kumu tamamen değiştirdikten sonra bir avuç eski kumu üstte bırakmak, kedinin yeni kumu tanımasını kolaylaştırır.",
          },
        ],
      },
      {
        id: "litter-placement",
        title: "Yerleştirme kuralları",
        summary: "Kutu yeri, kullanım alışkanlığını doğrudan etkiler.",
        blocks: [
          {
            type: "list",
            items: [
              "Sessiz, sakin ve kaçış yolu olan bir yer seçin.",
              "Mama ve su kaplarından en az 2 metre uzakta tutun.",
              "Çamaşır makinesi, kalorifer gibi gürültülü cihazlardan uzak durun.",
              "Her katta en az bir kum kabı bulundurun.",
              "Kapıların kapanmadığından emin olun; kedi kutuya erişemiyorsa sorun çıkar.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "play",
    title: "Oyun & Aktivite",
    emoji: "🎾",
    description: "Yaşa göre oyun, oyuncak seçimi ve zihinsel egzersiz.",
    tint: "bg-accent/20 text-emerald-700 dark:text-emerald-300",
    sections: [
      {
        id: "play-age",
        title: "Yaşa göre oyun süreleri",
        summary: "Kısa ve sık seanslar, uzun ve seyrek seanslardan iyidir.",
        blocks: [
          {
            type: "table",
            headers: ["Yaş", "Günlük süre", "Öneri"],
            rows: [
              ["0-6 ay", "3-5 kez × 10 dk", "Kovalama, yakalama, yumuşak oyuncaklar"],
              ["6-12 ay", "2-4 kez × 10-15 dk", "Tırmanma, puzzle, tüy çubuğu"],
              ["1-7 yaş", "2-3 kez × 15 dk", "Avlanma simülasyonu, top ve lazer (dikkatli)"],
              ["7+ yaş", "2 kez × 10 dk", "Yavaş tempolu, eklem dostu oyunlar"],
            ],
          },
          {
            type: "tip",
            text: "Oyunu kedinin yakalayabileceği bir oyuncakla bitirin. Yakalayamadığı lazer oyunları frustrasyon ve takıntılı davranış yaratabilir.",
          },
        ],
      },
      {
        id: "play-toys",
        title: "Oyuncak seçimi",
        summary: "Güvenlik ve çeşitlilik önemlidir.",
        blocks: [
          {
            type: "list",
            items: [
              "Tüy çubuğu: Avlanma içgüdüsünü en iyi tetikleyen oyuncak.",
              "Puzzle mama topu: Yavaş yemeyi ve zihinsel uyarımı destekler.",
              "Kağıt torba ve kutular: Basit ama çok etkili saklanma alanları.",
              "İnteraktif oyuncaklar: Sahibi yokken sıkılmayı azaltır.",
              "İp, tüy ve küçük parçalar: Yutma riski nedeniyle gözetimsiz bırakılmamalıdır.",
            ],
          },
          {
            type: "warn",
            text: "Lazer pointer, yansıtıcı ve gözetimsiz oyuncaklar takıntıya yol açabilir. Her oyun seansını fiziksel bir ödülle bitirin.",
          },
        ],
      },
      {
        id: "play-scratch",
        title: "Tırmalama tahtası",
        summary: "Tırmalama doğal bir ihtiyaçtır, cezalandırılmaz.",
        blocks: [
          {
            type: "list",
            items: [
              "Dikey tırmalama direği kedinin tam boyu kadar yüksek olmalı; ayakta tırmalayabilmeli.",
              "Sisal halat, halıdan daha çekicidir.",
              "Kedinin uyandığı ve dolaştığı yere yerleştirin.",
              "Mobilya tırmalıyorsa direği oraya taşıyın; ceza yerine yönlendirme yapın.",
              "Direği sallanmayacak şekilde sabitleyin; oynak direk güven vermez.",
            ],
          },
        ],
      },
      {
        id: "play-mental",
        title: "Zihinsel egzersizler",
        summary: "Fiziksel oyun kadar zihinsel uyarım da gerekir.",
        blocks: [
          {
            type: "list",
            items: [
              "Mama tanelerini evin farklı yerlerine saklayarak arama oyunu oynayın.",
              "Puzzle besleyici kullanarak öğün süresini uzatın.",
              "Boş kutulara delik açıp içine oyuncak saklayın.",
              "Yeni koku ve dokular sunun; rotasyonla oyuncakları değiştirin.",
              "Kedinin yaşına ve sağlığına uygun zorluk seçin.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "behavior",
    title: "Davranış & Eğitim",
    emoji: "🏠",
    description: "Tırmalama, ısırma, gece aktivitesi ve stres yönetimi.",
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    sections: [
      {
        id: "behavior-scratch",
        title: "Mobilya tırmalama",
        summary: "Ceza işe yaramaz; alternatif sunmak işe yarar.",
        blocks: [
          {
            type: "list",
            items: [
              "Tırmaladığı yere tırmalama direği veya halı kaplı panel yerleştirin.",
              "Tırmaladığı yüzeyi geçici olarak çift taraflı bant veya alüminyum folyo ile kaplayın.",
              "Doğru yeri tırmaladığında sakin bir ödül verin.",
              "Tırnakları düzenli kesmek hasarı azaltır.",
              "Su sıkmak, bağırmak ve cezalandırmak güveni zedeler.",
            ],
          },
        ],
      },
      {
        id: "behavior-biting",
        title: "Isırma ve tırmalama",
        summary: "Oyun ısırması ile korku ısırması farklıdır.",
        blocks: [
          {
            type: "p",
            text: "Yavru kedilerde oyun ısırması normaldir; el yerine oyuncak kullanmak gerekir. Yetişkin kedide aniden başlayan ısırma genellikle ağrı, stres veya aşırı uyarılma işaretidir.",
          },
          {
            type: "list",
            items: [
              "Ellerinizi oyuncak olarak kullanmayın; tüy çubuğu kullanın.",
              "Kedi ısırdığında elinizi çekip oyunu 10 saniye durdurun.",
              "Kuyruk savurma, kulak yatırma gibi uyarı işaretlerinde oyunu bitirin.",
              "Yeni ısırma davranışı için ağrı kaynağını veterinerinize değerlendirtin.",
            ],
          },
        ],
      },
      {
        id: "behavior-night",
        title: "Gece aktivitesi",
        summary: "Kediler alacakaranlık avcısıdır; gece enerjisi normaldir.",
        blocks: [
          {
            type: "list",
            items: [
              "Yatmadan 30-45 dakika önce yoğun oyun seansı yapın.",
              "Akşam öğününü oyundan sonra verin; avlanma → yemek → uyku döngüsü oluşur.",
              "Gece mama vermek davranışı pekiştirir; ödül vermeyin.",
              "Gece kapıyı kapatmak 1-2 hafta miyavlama artışına neden olabilir, sonra azalır.",
              "Gündüz uyku alanı ve tırmanma imkânı sağlayın.",
            ],
          },
        ],
      },
      {
        id: "behavior-stress",
        title: "Stres belirtileri",
        summary: "Kediler stresi davranış değişikliğiyle gösterir.",
        blocks: [
          {
            type: "list",
            items: [
              "Kutu dışına idrar/yapma",
              "Aşırı tımar, tüy yolma",
              "İştah kaybı veya aşırı yeme",
              "Saklanma, saldırganlık, sürekli miyavlama",
              "Eşya devirme, tırmalama artışı",
            ],
          },
          {
            type: "p",
            text: "Taşınma, yeni ev hayvanı, rutin değişikliği ve gürültü stresi tetikler. Geçiş döneminde kediye sessiz bir kaçış alanı, feromon difüzörü ve sabit rutin sunun. Belirtiler 1-2 haftada geçmezse veteriner davranış uzmanına danışın.",
          },
        ],
      },
    ],
  },
  {
    id: "breeds",
    title: "Irk Rehberi",
    emoji: "🐾",
    description: "51 ırk için özellikler, bakım notları ve sağlık riskleri.",
    tint: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    sections: [],
  },
  {
    id: "donts",
    title: "Yapılmaması Gerekenler",
    emoji: "❌",
    description: "Kediler için tehlikeli yiyecekler ve yaygın hatalar.",
    tint: "bg-destructive/10 text-danger",
    sections: [
      {
        id: "dont-chocolate",
        title: "Çikolata vermeyin",
        summary: "Teobromin kediler için toksiktir.",
        blocks: [
          {
            type: "warn",
            text: "Çikolata, kakao ve kahve ürünleri kalp ritim bozukluğu, titreme ve nöbete yol açabilir. Küçük miktar bile risklidir.",
          },
        ],
      },
      {
        id: "dont-onion",
        title: "Soğan, sarımsak, pırasa vermeyin",
        summary: "Alyuvarları parçalayarak kansızlık yapar.",
        blocks: [
          {
            type: "warn",
            text: "Pişmiş veya çiğ, toz hâlinde bile zararlıdır. Ev yemeklerine katılan soğan suyu dahi kediye verilmemelidir.",
          },
        ],
      },
      {
        id: "dont-grape",
        title: "Üzüm ve kuru üzüm vermeyin",
        summary: "Böbrek yetmezliğine neden olabilir.",
        blocks: [
          {
            type: "warn",
            text: "Üzüm, kuru üzüm ve bunları içeren kek/kurabiyeler kesinlikle verilmemelidir. Az miktarda bile ciddi sonuç doğurabilir.",
          },
        ],
      },
      {
        id: "dont-milk",
        title: "Süt ve süt ürünleri vermeyin",
        summary: "Yetişkin kediler laktozu sindiremez.",
        blocks: [
          {
            type: "warn",
            text: "Süt ishal ve gaz yapar. Su her zaman en iyi içecektir; özel laktozsuz kedi sütü istisnadır.",
          },
        ],
      },
      {
        id: "dont-raw",
        title: "Çiğ balık ve çiğ et vermeyin",
        summary: "Bakteri ve parazit riski taşır.",
        blocks: [
          {
            type: "warn",
            text: "Çiğ balıkta tiaminaz enzimi B1 vitamini eksikliğine; çiğ ette Salmonella ve parazit riski vardır. Çiğ beslenme ancak veteriner gözetiminde planlanmalıdır.",
          },
        ],
      },
      {
        id: "dont-caffeine",
        title: "Kafein ve enerji içecekleri vermeyin",
        summary: "Kalp ve sinir sistemi için tehlikelidir.",
        blocks: [
          {
            type: "warn",
            text: "Kahve, çay, kola, çikolata ve enerji içecekleri titreme, hızlı kalp atışı ve nöbete yol açabilir.",
          },
        ],
      },
      {
        id: "dont-human-meds",
        title: "İnsan ilacı vermeyin",
        summary: "Parasetamol ve ibuprofen kediler için ölümcüldür.",
        blocks: [
          {
            type: "warn",
            text: "Ağrı kesici, soğuk algınlığı ilacı ve vitaminleri hekim önerisi olmadan vermeyin. Doz hesaplaması kedi metabolizmasına göre yapılmalıdır.",
          },
        ],
      },
      {
        id: "dont-lilies",
        title: "Zambak ve bazı bitkilerden uzak tutun",
        summary: "Zambak, kedilerde akut böbrek yetmezliği yapar.",
        blocks: [
          {
            type: "warn",
            text: "Zambak, sümbül, lale, difenbahya ve sarmaşık gibi bitkiler zehirlidir. Evde kedi varsa zambak bulundurmayın; polen ve suyu bile risklidir.",
          },
        ],
      },
      {
        id: "dont-punish",
        title: "Fiziksel ceza uygulamayın",
        summary: "Ceza korku ve saldırganlığı artırır.",
        blocks: [
          {
            type: "warn",
            text: "Vurmak, su sıkmak, bağırmak ve burnunu sürtmek davranışı düzeltmez; güveni yok eder. İstenmeyen davranışı alternatif sunarak yönlendirin.",
          },
        ],
      },
      {
        id: "dont-free-feed",
        title: "Mama kabını sürekli dolu bırakmayın",
        summary: "Obezite ve iştah kontrolü sorunlarına yol açar.",
        blocks: [
          {
            type: "warn",
            text: "Ölçüsüz serbest besleme kilo alımını hızlandırır. Öğünleri tartın, günlük kaloriyi takip edin.",
          },
        ],
      },
    ],
  },
  {
    id: "dos",
    title: "Yapılması Gerekenler",
    emoji: "✅",
    description: "Sağlıklı ve mutlu bir kedi için günlük alışkanlıklar.",
    tint: "bg-accent/20 text-emerald-700 dark:text-emerald-300",
    sections: [
      {
        id: "do-water",
        title: "Her gün taze su verin",
        summary: "Böbrek ve idrar yolu sağlığının temeli.",
        blocks: [
          {
            type: "tip",
            text: "Suyu günde en az bir kez değiştirin, kabı yıkayın. Birden fazla noktada su kabı bulundurun.",
          },
        ],
      },
      {
        id: "do-play",
        title: "Her gün oyun oynayın",
        summary: "Fiziksel ve zihinsel sağlık için şart.",
        blocks: [
          {
            type: "tip",
            text: "Günde en az 2 kez, 10-15 dakikalık avlanma temelli oyun yapın. Oyunu yakalanan oyuncakla bitirin.",
          },
        ],
      },
      {
        id: "do-litter",
        title: "Kumu günde 2 kez temizleyin",
        summary: "Kediler temiz tuvaleti seçer.",
        blocks: [
          {
            type: "tip",
            text: "Sabah ve akşam tırmıkla temizleyin. Haftada bir tam temizlik yapın; kedi sayısı + 1 kutu kuralını uygulayın.",
          },
        ],
      },
      {
        id: "do-weigh",
        title: "Aylık kilo takibi yapın",
        summary: "Kilo değişimi erken hastalık işaretidir.",
        blocks: [
          {
            type: "tip",
            text: "Aynı tartıda, açken ve aynı saatte tartın. PatiRehber'deki kilo grafiğine kaydedin.",
          },
        ],
      },
      {
        id: "do-vet",
        title: "Yılda en az bir kez kontrole gidin",
        summary: "Erken teşhis hayat kurtarır.",
        blocks: [
          {
            type: "tip",
            text: "Aşı, diş ve kilo kontrolünü yıllık muayeneye dahil ettirin. 7 yaş üstü kedilerde yılda iki kontrol önerilir.",
          },
        ],
      },
      {
        id: "do-groom",
        title: "Tüy bakımını düzenli yapın",
        summary: "Tüy yumağı ve cilt sorunlarını önler.",
        blocks: [
          {
            type: "tip",
            text: "Kısa tüylü kedileri haftada 1, uzun tüylüleri haftada 2-3 kez tarayın. Dökülme döneminde sıklığı artırın.",
          },
        ],
      },
      {
        id: "do-enrich",
        title: "Çevresini zenginleştirin",
        summary: "Kapalı yaşam, uyarım eksikliği yaratabilir.",
        blocks: [
          {
            type: "tip",
            text: "Tırmanma rafı, pencere yatağı, saklanma kutusu ve değişen oyuncaklarla evi keşfedilebilir kılın.",
          },
        ],
      },
      {
        id: "do-id",
        title: "Kimlik ve mikroçip yaptırın",
        summary: "Kaybolma riskine karşı en etkili koruma.",
        blocks: [
          {
            type: "tip",
            text: "Mikroçip uygulatın ve iletişim bilgilerinizi güncel tutun. Dışarı çıkan kediler için tasma ve künye kullanın.",
          },
        ],
      },
    ],
  },
  {
    id: "firstdays",
    title: "İlk Günler",
    emoji: "🏠",
    description: "Yeni kedi evde: ilk 72 saat, güvenli oda, uyum ve sosyalleşme.",
    tint: "bg-primary/10 text-primary-strong",
    sections: [
      {
        id: "firstdays-safe-room",
        title: "Güvenli oda (ilk 1-3 gün)",
        summary: "Yeni kedi için küçük, sessiz ve kontrol edilebilir bir alan.",
        blocks: [
          { type: "p", text: "Kediyi eve getirdiğinizde tüm evi gezdirmeyin. Tek bir odada (yatak odası/banyo) mama, su, kum ve yatak bulundurun; kapı kapalı olsun." },
          { type: "list", items: [
            "Mama ve su birbirinden ve kumdan uzakta, sessiz köşede.",
            "Kum kabı düşük kenarlı ve kolay erişilebilir olsun.",
            "Yüksek bir dinlenme noktası (radyatör üstü, kedi ağacı) verin.",
            "Çamaşır makinesi, çöp kutusu, açık pencere gibi tehlikelere erişim kapatın.",
          ] },
          { type: "tip", text: "İlk günlerde ziyaretçi ve gürültüyü minimuma indirin; kedi kendini güvende hissettiğinde keşfe çıkar." },
        ],
      },
      {
        id: "firstdays-333",
        title: "3-3-3 kuralı",
        summary: "Uyum sürecinin gerçekçi zaman çizelgesi.",
        blocks: [
          { type: "table", headers: ["Süre", "Beklenti"], rows: [
            ["İlk 3 gün", "Stres, saklanma, az yeme; normaldir."],
            ["İlk 3 hafta", "Rutine alışma, güven artışı."],
            ["İlk 3 ay", "Gerçek kişiliğin ortaya çıkması."],
          ] },
          { type: "warn", text: "İlk 2 hafta içinde yemek yememe, gizlenme veya tıslama görürseniz panik yapmayın; sessizce destekleyin. 48 saatten uzun yemek reddi varsa veterinere başvurun." },
        ],
      },
      {
        id: "firstdays-socialization",
        title: "Sosyalleşme ve güven",
        summary: "El ile besleme, oyun ve pozitif pekiştirme.",
        blocks: [
          { type: "list", items: [
            "Kediyi zorla kucağa almayın; kendisi gelene kadar bekleyin.",
            "Oyuncak çubuğu ve ödül mamalarıyla kısa, pozitif seanslar yapın.",
            "İsim öğretin: ismini söyleyip ödül verin.",
            "Diğer evcil hayvanlarla tanıştırmayı kademeli yapın (koklama alışverişi, kapı arkası).",
          ] },
          { type: "tip", text: "Feliway (sentetik feromon) difüzörü ilk haftalarda stresi azaltabilir." },
        ],
      },
    ],
  },
  {
    id: "care",
    title: "Bakım & Hijyen",
    emoji: "🧼",
    description: "Tüy, tırnak, diş, kulak ve göz bakımı; banyo gerekli mi?",
    tint: "bg-accent/10 text-emerald-700 dark:text-emerald-300",
    sections: [
      {
        id: "care-brushing",
        title: "Tüy bakımı ve tarama",
        summary: "Kısa/uzun tüylü kediler için farklı sıklık.",
        blocks: [
          { type: "table", headers: ["Tüy tipi", "Sıklık", "Araç"], rows: [
            ["Kısa tüylü", "Haftada 1-2", "Kauçuk fırça, tarama eldiveni"],
            ["Uzun tüylü", "Günde 1", "Paslanmaz çelik tarak, slicker fırça"],
            ["Çift katlı (Persian, Maine Coon)", "Günde 1-2", "Undercoat tarağı"],
          ] },
          { type: "warn", text: "Tüy yumakları (mat) kesinlikle makasla kesmeyin; deriye yapışık olabilir. Veteriner/kuaför yardımı alın." },
        ],
      },
      {
        id: "care-nails",
        title: "Tırnak kesimi",
        summary: "2-4 haftada bir; pembe damara dikkat.",
        blocks: [
          { type: "list", items: [
            "Kediyi sakin bir zamanda, battaniyeye sararak tutun.",
            "Tırnağı ışığa tutun; pembe damarı (quick) görün.",
            "Sadece şeffaf ucu, damardan 2 mm uzakta kesin.",
            "Kanarsa styptic toz veya mısır nişastası uygulayın.",
          ] },
          { type: "tip", text: "Tırnak kesimini oyun seansı gibi kısa tutun; tek seferde 1-2 tırnak kesip ödül verin." },
        ],
      },
      {
        id: "care-teeth",
        title: "Diş bakımı",
        summary: "Diş taşı ve diş eti hastalıkları.",
        blocks: [
          { type: "p", text: "Kedilerde diş taşı 3 yaşından itibaren yaygın. Günlük diş fırçalama en etkili yöntemdir." },
          { type: "list", items: [
            "Kedi diş macunu (florürsüz, enzimli) ve parmak fırça kullanın.",
            "İlk haftalarda sadece macunu yalamasına izin verin.",
            "Diş eti kızarıklığı, kötü nefes, salya: veterinere başvurun.",
            "Yılda 1 kez veteriner diş kontrolü önerilir.",
          ] },
        ],
      },
      {
        id: "care-ears-eyes",
        title: "Kulak ve göz temizliği",
        summary: "Rutin kontrol, temizleme ne zaman?",
        blocks: [
          { type: "list", items: [
            "Kulak: koyu kahve akıntı, kaşıma, baş sallama → akar/mantar olabilir.",
            "Göz: hafif çapak günlük nemli pamukla silin; yeşil/sarı akıntı enfeksiyon işaretidir.",
            "Kulak temizleme solüsyonunu veterinerinizin önerdiği marka ile kullanın.",
          ] },
          { type: "warn", text: "Kulak çubuğu (Q-tip) kullanmayın; kiri daha derine iter." },
        ],
      },
      {
        id: "care-bath",
        title: "Banyo gerekli mi?",
        summary: "Kediler kendini temizler; banyo istisnai.",
        blocks: [
          { type: "p", text: "Sağlıklı kedi rutin banyo gerektirmez. Banyo: parazit tedavisi sonrası, yağ/boyar madde bulaşması, yaşlı/obez hareket kısıtlılığı durumlarında." },
          { type: "list", items: [
            "Kedi şampuanı (pH uygun) kullanın; insan şampuanı yasak.",
            "Ilık su, düşük basınç; yüz ve kulaklara su değdirmeyin.",
            "Havluyla kurulayın; saç kurutma makinesi düşük ayarda, sessiz modda.",
          ] },
        ],
      },
    ],
  },
  {
    id: "seasons",
    title: "Mevsim & Güvenlik",
    emoji: "☀️",
    description: "Sıcak/soğuk hava, toksik bitkiler, ev güvenliği ve zehirlenme.",
    tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    sections: [
      {
        id: "seasons-heat",
        title: "Sıcak hava ve güneş çarpması",
        summary: "Kedilerde ısı çarpması belirtileri.",
        blocks: [
          { type: "list", items: [
            "Belirtiler: hızlı solunum, ağız açık nefes, letarji, kusma, kırmızı dil/diş eti.",
            "Serin, gölgeli alan; taze su; pencere sinekliği ile havalandırma.",
            "Arabada asla yalnız bırakmayın; gölgede bile dakikalar içinde tehlikeli olur.",
          ] },
          { type: "warn", text: "Şüphe varsa hemen serin (buzsuz) su ile ıslatın ve veterinere götürün; buz kullanmayın." },
        ],
      },
      {
        id: "seasons-cold",
        title: "Soğuk hava",
        summary: "Dışarıda kalma, antifriz tehlikesi.",
        blocks: [
          { type: "list", items: [
            "Antifriz (etilen glikol) çok toksiktir ve tatlıdır; garaj zeminini temiz tutun.",
            "Dışarıda kalan kediler için yalıtımlı barınak; su kabı donmasın.",
            "Yaşlı ve kısa tüylü kedileri soğuktan koruyun.",
          ] },
        ],
      },
      {
        id: "seasons-toxic-plants",
        title: "Zehirli bitkiler",
        summary: "Evde bulundurulmaması gerekenler.",
        blocks: [
          { type: "list", items: [
            "Zambak (Lily) — kediler için çok toksik, böbrek yetmezliği.",
            "Pothos, difenbahya, philodendron — ağız/boğaz tahrişi.",
            "Aloe vera, sago palm, azalea, oleander.",
            "Paskalya çiçeği, karanfil, lale soğanı.",
          ] },
          { type: "tip", text: "Güvenli alternatifler: kedi otu (cat grass), spider plant, areca palm." },
        ],
      },
      {
        id: "seasons-home-safety",
        title: "Ev güvenliği checklist",
        summary: "Kedi dostu ev için kontrol listesi.",
        blocks: [
          { type: "list", items: [
            "Pencerelerde sineklik/güvenlik filesi.",
            "Kablo saklama, priz koruyucuları.",
            "Çamaşır makinesi/bulaşık makinesi kapağını kapalı tutun.",
            "Tuvalet fırçası ve temizlik kimyasallarını kilitli dolapta.",
            "İplik, lastik, iğne, plastik torba gibi yutulabilirleri ortadan kaldırın.",
          ] },
        ],
      },
    ],
  },
  {
    id: "travel",
    title: "Seyahat & Taşıma",
    emoji: "✈️",
    description: "Taşıma çantası, yolculuk, konaklama ve evcil hayvan pasaportu.",
    tint: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    sections: [
      {
        id: "travel-carrier",
        title: "Taşıma çantası seçimi ve alıştırma",
        summary: "Stresi azaltan çanta ve eğitim.",
        blocks: [
          { type: "list", items: [
            "Sert plastik çanta (üstten açılan) en güvenli.",
            "Çantayı evde açık bırakın; içine yatak ve ödül koyun.",
            "Kısa seanslar: çantaya gir → ödül → çık.",
            "Asla çantayı ceza olarak kullanmayın.",
          ] },
          { type: "tip", text: "Çantayı veterinere gitmeden önce birkaç gün evde açık bırakmak stresi ciddi azaltır." },
        ],
      },
      {
        id: "travel-car",
        title: "Araba yolculuğu",
        summary: "Güvenli ve konforlu seyahat.",
        blocks: [
          { type: "list", items: [
            "Çanta arka koltukta, emniyet kemeri ile sabitlenmeli.",
            "Yolculuktan 2-3 saat önce mama vermeyin (mide bulantısı).",
            "Su molası verin; sıcak havalarda klimayı açık tutun.",
            "Uzun yolculuklarda kum kabı ve ped bulundurun.",
          ] },
          { type: "warn", text: "Kediyi kucağınızda veya serbest bırakarak seyahat etmeyin; kaza riski yüksektir." },
        ],
      },
      {
        id: "travel-pet-passport",
        title: "Evcil hayvan pasaportu ve seyahat",
        summary: "Yurt içi/yurt dışı gereksinimler.",
        blocks: [
          { type: "list", items: [
            "Mikroçip zorunlu (ISO standart).",
            "Kuduz aşısı ve gerekli diğer aşılar güncel olmalı.",
            "Yurt dışı: ülkeye özgü sağlık sertifikası, kan tahlili (titre) gerekebilir.",
            "Uçak: havayolu kurallarını kontrol edin (kabin/hammul, çanta boyutu).",
          ] },
          { type: "tip", text: "Seyahatten en az 1 ay önce veterinere danışın; bazı işlemler zaman alır." },
        ],
      },
    ],
  },
  {
    id: "lifestages",
    title: "Yaşam Evreleri",
    emoji: "🌱",
    description: "Yavru, yetişkin, yaşlı ve gebelik/doğum bakımı.",
    tint: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    sections: [
      {
        id: "lifestages-kitten",
        title: "Yavru kedi bakımı (0-12 ay)",
        summary: "Beslenme, aşı, sosyalleşme.",
        blocks: [
          { type: "list", items: [
            "Anne sütü veya yavru maması; 4 haftadan itibaren katı mama.",
            "Aşı serisi: 8, 12, 16 hafta; kuduz 12-16 hafta.",
            "İç/dış parazit: 2-3 haftada bir, veteriner önerisiyle.",
            "Sosyalleşme penceresi: 2-7 hafta; insan/ ses/ oyun alıştırması.",
          ] },
          { type: "warn", text: "Yavru kediler hipoglisemiye (düşük kan şekeri) yatkındır; düzenli mama verin." },
        ],
      },
      {
        id: "lifestages-adult",
        title: "Yetişkin kedi (1-7 yaş)",
        summary: "Koruyucu bakım ve kilo kontrolü.",
        blocks: [
          { type: "list", items: [
            "Yıllık veteriner kontrolü ve aşı rapeli.",
            "İdeal kiloyu koruyun; obezite diyabet ve eklem sorunlarına yol açar.",
            "Diş temizliği ve tüy bakımı rutini.",
            "Zenginleştirme (oyun, tırmanma, avlanma oyunları) stresi azaltır.",
          ] },
        ],
      },
      {
        id: "lifestages-senior",
        title: "Yaşlı kedi (7+ yaş)",
        summary: "Böbrek, tiroid, eklem ve bilişsel değişimler.",
        blocks: [
          { type: "list", items: [
            "6 ayda bir veteriner kontrolü; böbrek/tiroid tahlilleri.",
            "Kolay erişilebilir mama/su/kum; alçak kenarlı kum kabı.",
            "Isıtıcı yatak, rampa ile yüksek yerlere erişim.",
            "Su tüketimini artırın; yaşlı kedilerde böbrek hastalığı sık.",
          ] },
          { type: "tip", text: "İdrar miktarı/koku değişimi, kilo kaybı veya artmış susama yaşlı kedi için erken uyarı işaretidir." },
        ],
      },
      {
        id: "lifestages-pregnancy",
        title: "Gebelik ve doğum",
        summary: "Gebelik takibi ve yavru bakımı.",
        blocks: [
          { type: "list", items: [
            "Gebelik süresi ~63-65 gün.",
            "Gebelikte yüksek kaliteli yavru mamasına geçin; mama miktarını artırın.",
            "Doğum için sessiz, sıcak ve güvenli bir kutu hazırlayın.",
            "Doğum sonrası anne ve yavruları veteriner kontrolüne alın.",
          ] },
          { type: "warn", text: "Gebelik şüphesi veya doğum komplikasyonlarında (ıkınma >30 dk, kanama) hemen veterinere başvurun." },
        ],
      },
    ],
  },
  {
    id: "psychology",
    title: "Kedi Psikolojisi",
    emoji: "🧠",
    description: "Stres, kaygı, zenginleştirme ve davranış problemlerinin yönetimi.",
    tint: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    sections: [
      {
        id: "psych-enrichment",
        title: "Zenginleştirme (enrichment)",
        summary: "Fiziksel ve zihinsel uyaranlarla stresi azaltma.",
        blocks: [
          { type: "p", text: "Kediler avcıdır; ev içi yaşamda avlanma dürtüsü karşılanmazsa stres ve davranış problemleri ortaya çıkar." },
          { type: "list", items: [
            "Günde 2-3 kısa avlanma oyunu (tüy çubuğu, lazer).",
            "Tırmanma ağacı, pencere izleme noktası, kutu/kâğıt tünel.",
            "Yemek bulmacaları (puzzle feeder) ile mama verme.",
            "Kokusal zenginleştirme: catnip, silvervine, kedi otu.",
            "Farklı yükseklikler ve saklanma yerleri.",
          ] },
          { type: "tip", text: "Oyun seansını 'yakala-öldür-ye' döngüsüyle bitirin: oyuncak yakalandıktan sonra mama ödülü verin." },
        ],
      },
      {
        id: "psych-stress",
        title: "Stres ve kaygı belirtileri",
        summary: "Kediler stresi nasıl gösterir?",
        blocks: [
          { type: "list", items: [
            "İdrar/kakayı ev içine yapma (litter box aversion).",
            "Aşırı tımarlama (aşırı yalanma) → kıl yumağı/deri sorunu.",
            "Saklanma, tıslama, kulakları geriye yatırma.",
            "İştah değişimi, aşırı miyavlama.",
            "Mobilya çizme, saldırganlık.",
          ] },
          { type: "warn", text: "Ani davranış değişimi çoğu zaman tıbbi bir sorunun (ağrı, idrar yolu enfeksiyonu) işaretidir; önce veteriner kontrolü." },
        ],
      },
      {
        id: "psych-multi-cat",
        title: "Çoklu kedi evi",
        summary: "Kaynak yönetimi ve çatışma azaltma.",
        blocks: [
          { type: "p", text: "Kaynak kuralı: her kedi için +1 (n+1) kum kabı, mama/su kabı ve dinlenme noktası." },
          { type: "list", items: [
            "Kum kablarını farklı odalara dağıtın.",
            "Mama kaplarını ayrı yerleştirin; rekabeti azaltın.",
            "Dikey alan (raf, ağaç) ile alan paylaşımını kolaylaştırın.",
            "Yeni kedi tanıtımını kademeli yapın (koklama alışverişi, kapı arkası).",
          ] },
        ],
      },
    ],
  },
  {
    id: "emergency2",
    title: "Acil Durum",
    emoji: "🚨",
    description: "Zehirlenme, travma ve ilk yardım adımları.",
    tint: "bg-destructive/10 text-danger",
    sections: [
      {
        id: "emergency-poison",
        title: "Zehirlenme: ilk adımlar",
        summary: "Ne yapıp ne yapmamalı?",
        blocks: [
          { type: "warn", text: "Kediyi asla kusturmaya çalışmayın; bazı maddeler (asit, alkali, hidrokarbon) kusmada daha fazla hasar verir." },
          { type: "list", items: [
            "Maddeyi uzaklaştırın, ağzını temizleyin (su ile).",
            "Etiketi/ambalajı saklayın.",
            "Hemen veterineri veya zehir danışma hattını arayın.",
            "Kedi bilincini yitirdiyse yan yatırın, solunum yolunu açık tutun.",
          ] },
          { type: "tip", text: "Zehir danışma: 112 veya en yakın veteriner kliniği. Madde adını ve miktarını söyleyin." },
        ],
      },
      {
        id: "emergency-common-toxins",
        title: "Yaygın toksinler",
        summary: "Evde bulunan tehlikeli maddeler.",
        blocks: [
          { type: "table", headers: ["Madde", "Belirtiler", "Aciliyet"], rows: [
            ["Parasetamol (asetaminofen)", "Morumsu diş eti, solunum güçlüğü", "Çok yüksek"],
            ["İbuprofen/naproksen", "Kusma, böbrek hasarı", "Yüksek"],
            ["Antifriz (etilen glikol)", "Sarhoşluk, böbrek yetmezliği", "Çok yüksek"],
            ["Çikolata (teobromin)", "Hiperaktivite, nöbet", "Orta-yüksek"],
            ["Soğan/sarımsak", "Anemi, halsizlik", "Orta"],
            ["Ksilitol (tatlandırıcı)", "Hipoglisemi", "Yüksek"],
          ] },
        ],
      },
      {
        id: "emergency-trauma",
        title: "Travma ve ilk yardım",
        summary: "Kaza, düşme, ısı ısırığı.",
        blocks: [
          { type: "list", items: [
            "Sakinleştirin, hareketi kısıtlayın (havlu ile sarın).",
            "Kanama varsa temiz bezle baskılı pansuman.",
            "Şüpheli kırıkta hareket ettirmeyin; veteriner taşıma çantasıyla.",
            "Isı çarpması: serin (buzsuz) su ile ıslatın, hemen veterinere.",
            "Nöbet: etrafı güvenli hale getirin, süre tutun, veterinere bildirin.",
          ] },
          { type: "warn", text: "Travma sonrası iç kanama belirtileri (soluk diş eti, abdominal şişlik, şok) gecikebilir; gözlem şart." },
        ],
      },
    ],
  },
];

export function getGuideCategory(id: string): GuideCategory | undefined {
  return guideCategories.find((category) => category.id === id);
}

/** Günün ipuçları — dashboard'da rastgele gösterilir */
export const dailyTips: string[] = [
  "Kediler taze suyu sever. Su kabını her gün yıkayıp yeniden doldurun; bu basit alışkanlık böbrek sağlığını korur.",
  "Oyunu kedinin yakalayabileceği bir oyuncakla bitirin. Yakalama, avlanma döngüsünü tamamlar ve stresi azaltır.",
  "Kum kabını mama kabından en az 2 metre uzağa koyun. Kediler yemek ve tuvalet alanlarını ayırmayı tercih eder.",
  "Kedinizin kilosunu ayda bir ölçün. Ani kilo kaybı, gizli hastalıkların en erken işaretlerinden biridir.",
  "Yatmadan önce 15 dakikalık oyun, gece aktivitesini belirgin biçimde azaltır.",
  "Diş fırçalamaya küçük yaşta başlayın. Ödül ve sabırla bu bakım rutin hâline gelebilir.",
  "Zambak gibi bitkiler kediler için ölümcüldür. Evde kedi varsa zambak bulundurmayın.",
  "Kediler başlarını ovuşturduğu yüzeyleri 'kendi bölgesi' olarak işaretler. Yeni eşyaları koklamasına izin verin.",
  "Mama değişikliğini 7 güne yayın. Ani geçiş ishal ve kusmaya neden olabilir.",
  "Tırmalama tahtasını kedinin uyandığı yere koyun; ayakta tırmalayabileceği yükseklikte olmalı.",
  "Kediler acıyı gizler. İştah, tuvalet veya uyku düzenindeki değişiklikleri not edin.",
  "Pencere filesi, şehirde yaşayan kediler için hayat kurtarır. Açık pencereleri güvenli hâle getirin.",
  "Serbest besleme yerine ölçülü öğünler obeziteyi önler. Günlük miktarı kedinizin kilosuna göre hesaplayın.",
  "Kedi çeşmesi su tüketimini artırabilir; ancak düzenli temizlik yapılmazsa bakteri üretir.",
  "Kısa tüylü kedileri bile haftada bir taramak tüy yumağı riskini azaltır ve bağınızı güçlendirir.",
];

/** Tarihe göre deterministik günün ipucu */
export function tipOfTheDay(date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return dailyTips[day % dailyTips.length];
}
