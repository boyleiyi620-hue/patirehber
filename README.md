# 🐾 PatiRehber

Mobil öncelikli, PWA destekli kedi bakım rehberi. Mama, su, kum, aşı, kilo ve veteriner takibini tek yerde toplar; 51 ırkın bakım bilgilerini, hesaplayıcıları, arkadaş paylaşımını ve acil durum rehberini sunar.

Kullanıcılar e-posta veya Google ile giriş yapar. Kedi profilleri ve bakım kayıtları Supabase hesabıyla eşitlenir; tarayıcıda ayrıca yerel bir kopya tutulur. Arkadaşlarla yalnızca kedinin adı, ırkı ve yaşı paylaşılır.

---

## İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
- [Komutlar](#komutlar)
- [Klasör yapısı](#klasör-yapısı)
- [Veri modeli ve saklama](#veri-modeli-ve-saklama)
- [PWA ve çevrimdışı kullanım](#pwa-ve-çevrimdışı-kullanım)
- [Bildirimler](#bildirimler)
- [Tema ve dil](#tema-ve-dil)
- [Demo veri](#demo-veri)
- [Erişilebilirlik](#erişilebilirlik)
- [Bilinen sınırlamalar](#bilinen-sınırlamalar)
- [Gizlilik](#gizlilik)
- [Lisans](#lisans)

---

## Özellikler

### Ana Sayfa (Dashboard)
- Kişiselleştirilmiş selamlama ve günlük bakım puanı (0–100)
- Bugünkü görevler: mama sayacı, su, kum ve oyun
- Hızlı işlemler (tek dokunuşla mama/su/kum/oyun kaydı)
- Yaklaşan hatırlatıcılar, günün ipucu
- Haftalık mini bakım grafiği ve seri (streak) göstergesi
- Çoklu kedi varsa aktif kedi seçimi

### Kedilerim
- Birden fazla kedi profili
- 4 adımlı ekleme sihirbazı: temel bilgiler → yaş/vücut → fotoğraf/sağlık → aşı özeti
- 51 ırk içinde arama ve ırk seçimi
- Profil sekmeleri: Genel, Bakım, Aşılar, Kilo, Galeri, Notlar
- Irka özel bakım notları, sağlık riskleri ve aktivite seviyesi
- Kilo geçmişi grafiği ve yeni ölçüm ekleme
- Aşı takvimi, veteriner bilgileri, fotoğraf galerisi (cihazda küçültülür)
- Profil düzenleme ve silme
- Yeni kedi eklendiğinde 7 temel hatırlatıcı otomatik oluşturulur

### Rehber
- 8 kategori: Beslenme, Sağlık, Tuvalet & Hijyen, Oyun & Aktivite, Davranış & Eğitim, Irk Rehberi, Yapılmaması Gerekenler, Yapılması Gerekenler
- Tam metin arama (2+ karakter)
- 51 ırk için filtreleme, arama ve detay kartları
- Hesaplayıcılar:
  - Günlük mama porsiyonu (kilo, öğün, yaş, aktivite, mama türü)
  - Günlük su ihtiyacı
  - Kedi yaşı → insan yaşı
  - Vücut kondisyon skoru (BCS 1–9) ve tahmini ideal kilo
- Klavye dostu akordeon yapısı

### Hatırlatıcılar
- 9 tür: mama, su, kum, ilaç/vitamin, pire/parazit, veteriner, kilo, oyun, özel gün
- Gün seçimi (tek tek günler, her gün, hafta içi, hafta sonu)
- Saat, kedi kapsamı, not ve aktif/pasif durumu
- Bugün / Tümü / Kapalı kapsamları; tür ve kedi filtreleri; arama
- Tamamlama, 30 dakika erteleme, düzenleme ve silme
- Tamamlama geçmişi, günlük ilerleme ve seri takibi
- Bildirim izni durumuna göre yönlendirme
- Sayfa içinde mama porsiyon hesaplayıcı

### Raporlar
- 7 / 14 / 30 günlük dönem seçimi
- Ortalama bakım puanı, aktif seri, öğün ve su/kum günleri
- Günlük puan çubuk grafiği
- Mama tüketimi tahmini (öğün × porsiyon ayarı)
- Oyun süresi ve kilo değişimi
- Rozetler ve ilerleme
- Birden fazla kedi için günlük karşılaştırma

### Acil Durum
- Kırmızı uyarı bandı ve veteriner arama bağlantısı (`tel:`)
- Zehirlenmede ilk 6 adım
- Acil belirti listesi
- Yiyecek, bitki, kimyasal ve ilaç zehir listeleri
- Yapılmaması gerekenler
- Profil düzenleme kısayolu

### Ayarlar
- Profil adı, günlük öğün hedefi, günlük mama gramajı
- Tema: Açık / Koyu / Sistem
- Dil: Türkçe / English (arayüz)
- Bildirim izni ve tür bazlı bildirim tercihleri, sessiz saatler
- PWA kurulum önerisi
- JSON dışa aktarma / içe aktarma
- Tüm verileri cihazdan ve hesaptan silme
- Depolama boyutu ve kayıt sayıları
- Hakkında, gizlilik ve sürüm bilgisi

### Arkadaşlar ve gizlilik
- Arkadaş koduyla istek gönderme ve kabul etme
- Kabul edilmiş arkadaşlara yalnızca kedi adı, ırkı ve yaşı gösterilir
- Fotoğraflar, sağlık/aşı kayıtları, kilo geçmişi, mikroçip, notlar ve veteriner bilgileri özel kalır
- Ham tablo erişimleri RLS ile sahip hesabına sınırlıdır; arkadaş görünümü güvenli, alanları izin listesine alınmış RPC'lerden gelir

---

## Yeni özellikler (v1.1+)

### Görevler
- Ayrı sayfa (`/tasks`) ve alt navigasyon butonu
- Görev ekleme: başlık, emoji, tür, hedef (1–10), kedi, not, tekrar (tek seferlik/günlük/haftalık), öncelik, son tarih
- 6 hazır şablon ve tap ile tamamlama/ilerletme
- Tamamlanan görevde üstü çizili ve 24 saat sonra otomatik silme (tekrarlayanlarda sonraki tekrar oluşur)
- Dashboard'da kompakt görev bölümü

### Sağlık günlüğü
- Kedi profili "Sağlık günlüğü" sekmesi
- Semptom, veteriner ziyareti, ilaç ve not kayıtları (tarih, başlık, not)

### Arama
- Global arama sayfası (`/search`): kediler, görevler, hatırlatıcılar ve rehber bölümleri

### Irk detayları
- Kedi profilinden ırk rehberini açma (bakım, beslenme, aktivite, uyumluluk, sağlık riskleri)

### PWA ve kalite
- Service worker (offline destek, önbellek)
- Manifest (kısayollar, maskable ikonlar)
- Lighthouse a11y/best-practices/SEO 100
- Hata sayfası (error/not-found) ve hata sınırları

## Teknolojiler

| Katman | Teknoloji |
| --- | --- |
| Framework | Next.js 14.2 (App Router) |
| Dil | TypeScript 5 |
| Stil | Tailwind CSS 3.4, özel tema tokenları |
| Bileşenler | shadcn/ui esintili, Radix'siz özel primitives (`cva`, `clsx`, `tailwind-merge`) |
| İkonlar | Lucide React |
| Animasyon | CSS geçişleri ve keyframe'ler |
| Veri | Supabase Auth + PostgreSQL; LocalStorage yerel kopya |
| PWA | `manifest.json`, özel service worker |
| Yazı tipi | Nunito (Google Fonts) |

Renk paleti:

| Rol | Renk |
| --- | --- |
| Primary | `#FF8C42` |
| Arka plan | `#FFF4E6` |
| Metin | `#2D2D2D` |
| Accent | `#7BC96F` |

---

## Kurulum

Gereksinimler: **Node.js 18.17+** (önerilen 20+) ve npm.

```bash
# Bağımlılıklar
npm install

# Geliştirme sunucusu
npm run dev
```

Ardından <http://localhost:3000> adresini açın.

Üretim derlemesi:

```bash
npm run build
npm start
```

> PWA service worker'ı `localhost` ve HTTPS üzerinde çalışır. Üretimde `NEXT_PUBLIC_SITE_URL` ortam değişkeni ile kanonik adresi ayarlayabilirsiniz (varsayılan: `https://patirehber.app`).

### İkonlar

PWA ikonları bağımlılık gerektirmeyen bir PNG üreteci ile oluşturulur:

```bash
npm run icons
```

Bu komut `public/icons/` altına 192, 512, maskable 512 ve Apple touch ikonlarını yazar.

---

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi (tip kontrolü ve lint dahil) |
| `npm start` | Üretim sunucusu |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next.js ESLint |
| `npm run icons` | PWA ikonlarını yeniden üret |

---

## Klasör yapısı

```text
patirehber/
├─ public/
│  ├─ icons/                     # PWA ikonları
│  ├─ icon.svg
│  ├─ manifest.json
│  └─ sw.js                      # Service worker
├─ scripts/
│  └─ generate-icons.mjs         # Bağımlılıksız PNG üreteci
├─ supabase/
│  └─ migrations/                # Veritabanı güvenlik ve paylaşım değişiklikleri
├─ .github/workflows/
│  └─ ci.yml                     # Lint, typecheck, test ve üretim derlemesi
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # Metadata, tema script'i, provider'lar
│  │  ├─ page.tsx                # Dashboard
│  │  ├─ globals.css             # Tema tokenları ve yardımcı sınıflar
│  │  ├─ cats/
│  │  │  ├─ page.tsx
│  │  │  ├─ new/page.tsx
│  │  │  └─ [id]/page.tsx
│  │  ├─ guide/page.tsx
│  │  ├─ reminders/page.tsx
│  │  ├─ reports/page.tsx
│  │  ├─ settings/page.tsx
│  │  ├─ emergency/page.tsx
│  │  ├─ offline/page.tsx
│  │  └─ not-found.tsx
│  ├─ components/
│  │  ├─ layout/                 # App shell, alt menü, başlık, avatar
│  │  ├─ providers/              # AppProvider, bildirim zamanlayıcı, PWA kayıt
│  │  ├─ dashboard/              # Puan halkası, haftalık grafik
│  │  ├─ cats/                   # Kilo grafiği
│  │  ├─ guide/                  # Irk gezgini, hesaplayıcılar
│  │  ├─ reminders/              # Hatırlatıcı diyaloğu
│  │  ├─ ui/                     # Button, Card, Dialog, Tabs, Switch, ...
│  │  └─ views/                  # Sayfa görünümleri
│  └─ lib/
│     ├─ types.ts                # Veri tipleri
│     ├─ storage.ts              # LocalStorage okuma/yazma/doğrulama
│     ├─ demo-data.ts            # Demo veri ve varsayılan ayarlar
│     ├─ reminders.ts            # Varsayılan hatırlatıcılar
│     ├─ utils.ts                # Tarih, puan, seri, rozet, biçimlendirme
│     ├─ calculators.ts          # Porsiyon, su, yaş, BCS
│     ├─ breeds.ts               # 51 ırk
│     ├─ guide-data.ts           # 8 rehber kategorisi ve ipuçları
│     ├─ notifications.ts        # Bildirim izni ve gönderim
│     ├─ i18n.ts                 # TR/EN arayüz sözlüğü
│     └─ image.ts                # Fotoğraf küçültme
├─ next.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

---

## Veri modeli ve saklama

Supabase, hesap verilerinin kalıcı kaynağıdır. Tarayıcıdaki `LocalStorage` uygulama kopyasını tutar; ilk yüklemede güncel veriler sunucudan alınır. İlk yükleme çevrimiçi erişim gerektirir; çevrimdışı açılışta kayıtları geri yükleme garanti edilmez. Eşitleme hataları uygulama içinde gösterilir ve yeniden denenebilir.

Yerel kopya anahtarı:

```text
patirehber:data:v1
```

Üst düzey yapı:

```ts
interface AppData {
  version: number;
  settings: Settings;
  cats: Cat[];
  reminders: Reminder[];
  logs: DailyLog[];
  tasks: Task[];
  healthEntries: HealthEntry[];
  meta: { createdAt: string; lastOpenedAt: string };
}
```

- `Cat`: ad, ırk, doğum tarihi, cinsiyet, kilo, kısırlık, aktivite, fotoğraf, galeri, notlar, aşılar, kilo geçmişi, veteriner bilgileri.
- `Reminder`: tür, başlık, saat, günler, kedi kapsamı, aktiflik, seri, geçmiş, erteleme zamanı.
- `DailyLog`: günlük mama sayısı, su, kum, oyun dakikaları (tarih + kedi başına tek kayıt).
- `Settings`: tema, dil, kullanıcı adı, aktif kedi, öğün hedefi, porsiyon gramajı, bildirim tercihleri.

Uygulama `AppProvider` üzerinden değişiklikleri yerel kopyaya ve Supabase'e kaydeder. Eşitleme sıralı yürütülür; mevcut kayıtların tamamı başarıyla yazılmadan uzak silmeler uygulanmaz. Böylece yarım kalmış bir yükleme, eski verilerin topluca silinmesine yol açmaz.

Yedekleme: **Ayarlar → Veriler → JSON dışa aktar**. Aynı bölümden dosya içe aktarılabilir; içe aktarılan veri şema doğrulamasından geçer. Yedek, özel sağlık bilgileri de içerebilir; güvenli yerde saklanmalıdır.

Yerel kontroller: `npm run lint`, `npm run typecheck`, `npm test` ve `npm run build`. GitHub Actions bu dört kontrolü her push ve pull request'te çalıştırır. Veritabanı değişiklikleri `supabase/migrations/` altında sürümlenir.

---

## PWA ve çevrimdışı kullanım

- `public/manifest.json`: standalone görünüm, maskable ikon, kısayollar (Hatırlatıcılar, Kedilerim, Rehber).
- `public/sw.js`:
  - Kurulumda app shell önbelleği
  - Gezintilerde **network-first**, çevrimdışıysa önbellek ve `/offline` fallback
  - Statik varlıklarda **cache-first**
  - `push` ve `notificationclick` olayları için hazır altyapı
- Kurulum önerisi uygulama içinde gösterilir; reddedilirse ayarlardan tekrar açılabilir.
- Çevrimdışı sayfası ve `not-found` sayfası özel olarak tasarlanmıştır.

Yeni sürüm yayınlarken `sw.js` içindeki `CACHE_VERSION` değerini artırın.

---

## Bildirimler

- Bildirimler **yalnızca uygulama açıkken** yerel olarak kontrol edilir ve gönderilir.
- Tarayıcı izni gerekir; izin reddedilirse ayarlardan tarayıcı ayarlarına yönlendirme yapılır.
- Tür bazlı tercihler (mama, su, kum, sağlık) ve 22:00–08:00 sessiz saatler desteklenir.
- Service worker'da `push` olayı hazırdır; gerçek arka plan push bildirimleri için bir backend/push servisi gerekir.

---

## Tema ve dil

- Tema `light`, `dark` veya `system` olarak seçilir.
- İlk boyamadan önce `<head>` içindeki küçük script LocalStorage'daki temayı uygular; böylece karanlık modda beyaz parlama olmaz.
- Dil seçimi arayüz metinlerini değiştirir. **Rehber ve ırk içerikleri şu an Türkçedir**; İngilizce seçildiğinde bazı bölüm başlıkları Türkçe kalabilir. Bu durum ayarlarda kullanıcıya bildirilir.
- `lang` özniteliği şu an `tr` olarak sabittir; tam i18n için içerik çevirileri ve dinamik `lang` eklenmelidir.

---

## Demo veri

İlk açılışta otomatik olarak yüklenir:

- Kedi: **Mırmır** (Tekir, 3 yaşında, dişi, kısır, 4,6 kg)
- 10 hatırlatıcı (mama, su, kum, oyun, parazit, aşı, kilo)
- 14 günlük bakım kaydı
- 4 günlük seri ve örnek rozetler

Ayarlar → Veriler → Sıfırla ekranından **demo veriye dön** veya **boş başla** seçilebilir. Boş modda tüm ekranlar empty state gösterir.

---

## Erişilebilirlik

- Anlamsal başlıklar, `main`, `nav`, `role="tablist"` / `role="tab"` yapıları
- Klavye ile gezinebilen sekmeler, dialoglar ve akordeonlar
- `aria-label`, `aria-selected`, `aria-checked`, `aria-live` ve `role="alert"` kullanımı
- "İçeriğe geç" atlama bağlantısı
- Görünür odak halkaları
- `prefers-reduced-motion` desteği
- Renk kontrastı için açık/koyu tema tokenları

---

## Bilinen sınırlamalar

- Kayıtları ilk açılışta sunucudan yüklemek için internet bağlantısı gerekir; PWA önbelleği çevrimdışı veri erişimini garanti etmez.
- Tarayıcı verilerini temizlemek yerel kopyayı siler; çevrimiçi girişte kayıtlar Supabase hesabından yeniden yüklenir. Düzenli JSON yedeği önerilir.
- Fotoğraflar Base64 olarak saklanır ve depolama kotasını hızla doldurabilir; büyük galerilerde dikkatli olun.
- Bildirimler uygulama kapalıyken çalışmaz (arka plan push backend'i yoktur).
- İngilizce çeviri yalnızca arayüz metinlerini kapsar; rehber/ırk içerikleri Türkçedir.
- Veteriner telefonu ve acil durum yönlendirmeleri genel bilgilendirme amaçlıdır; tıbbi tavsiye yerine geçmez.

---

## Gizlilik

PatiRehber hesap girişi ve Supabase eşitlemesi kullanır; bu nedenle kayıtlar yalnızca tarayıcıda kalmaz. RLS, kullanıcıların kendi hesap satırlarına erişmesini sağlar. Arkadaşlar yalnızca kedi adı, ırkı ve yaşı görür; fotoğraf, sağlık/aşı geçmişi, kilo, mikroçip, notlar, ilaçlar ve veteriner bilgileri paylaşılmaz. JSON dışa aktarma dosyası tüm verileri içerebileceğinden özel kabul edilmelidir. Bu proje reklam veya izleme SDK'sı eklemez.

---

## Lisans

Bu proje kişisel kullanım için geliştirilmiştir. İçerikler genel bilgilendirme amaçlıdır; tanı ve tedavi için veteriner hekiminize başvurun.
