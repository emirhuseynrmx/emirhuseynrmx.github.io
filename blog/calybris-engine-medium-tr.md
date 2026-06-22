# Neden Reddettiğini Kanıtlayan Bir Karar Motoru Yazdım

*Her yapay zeka model çağrısının bir maliyeti var. Çoğu ekip bunu faturayı gördüğünde öğreniyor. Ben her çağrıyı olmadan önce değerlendiren — ve nedenini kaydeden bir motor yazdım.*

> **GÖRSEL 1 — `01-kapak-calybris.png`: Medium kapak görseli.**

---

Çoğu LLM maliyet tartışması "GPT-4'e çok fazla harcıyoruz" ile başlar. Ama harcama sorun değil. **Denetlenmeyen harcama** sorun.

Destek ekibiniz 50.000 bileti Claude Opus üzerinden yönlendiriyorsa ve Haiku'nun yeterli olup olmadığını kimse bilmiyorsa — bu bir maliyet sorunu değil. Bu bir yönetişim sorunu. Ve yönetişim sorunları model değiştirerek çözülmez. Her kararı denetlenebilir yaparak çözülür.

Calybris tam bunu yapıyor.

---

## Calybris Nedir

Calybris preskriptif bir karar motorudur. Karar ("bu isteği hangi model karşılasın?") ile icra ("sağlayıcıya gönder") arasında durur.

Her karar için şunları üretir:

- **Bir eylem**: izin ver, düşür, engelle, önbelleğe al veya yeniden dene
- **Maliyet tahmini**: bu kararın gerçek parasal karşılığı
- **Risk cezası**: model başarısız olursa ne olabilir
- **Kalite tabanı**: kabul edilebilir minimum sonuç
- **Kriptografik parmak izi**: karar girdileri, politika sürümü ve çıktının kriptografik olarak birbirine bağlandığının kanıtı

Motora kararın LLM yönlendirme, alım-satım sinyali veya müşteri kaybı müdahalesi hakkında olup olmadığı fark etmez. Kanıt yapısı aynıdır.

> **GÖRSEL 2 — `02-calybris-decision-engine.png`: Bu paragrafın altına ekle.**

---

## Kanıt Neden Önemli

Çoğu yönlendirme sistemi kara kutudur. İstek gelir, model seçilir, kimse nedenini bilmez. Bir şey ters giderse — pahalı bir model 0,05$'lık bir görev için kullanılmış ya da ucuz bir model uyumluluk incelemesi için seçilmişse — denetim izi yoktur.

Calybris her kararı hash-bağlantılı bir günlüğe zincirler. 47.291 numaralı karar, 47.290 numaralı kararın hash'ine referans verir. Birisi günlüğe müdahale ederse — bir karar siler veya maliyeti değiştirirse — zincir kırılır. Zincir, yeni kararlar kabul edilmeden önce kurtarma sırasında doğrulanır.

> **GÖRSEL 3 — `03-hash-zinciri.png`: Buraya ekle.**

**Pratik fayda**: CFO'nuz "geçen ay yapay zekaya neden 4.200$ harcadık?" diye sorduğunda, sadece bir kontrol paneli göstermezsiniz. Her doların belirli bir kiracıya, kullanım alanına, modele ve politika kararına izlenebilir olduğu tekrarlanabilir bir denetim izi verirsiniz.

---

## Tam Sayı Çekirdeği

Calybris'in çekirdeği tam sayı-tabanlı bir puanlama kernel'idir. Sıcak yolda kayan nokta aritmetiği yok, yığın tahsisi yok.

Neden tam sayılar? Kayan nokta uç durumları ve platform farklılıkları deterministik tekrarı baltalayabilir. Sabit nokta tam sayı puanlaması Calybris'e kararlı, tekrarlanabilir sıralama verir. Bir karar günlüğünü farklı bir makinede tekrarlarsam, aynı cevabı almam gerekir.

Kernel, uygun her modeli bir fayda fonksiyonuna göre değerlendirir:

```text
fayda = (kalite-ayarlı değer) − (risk cezası) − (maliyet) − (gecikme cezası)
```

En yüksek faydaya sahip modeli seçer. Hiçbir modelin pozitif faydası yoksa isteği engeller. Ayrıca **karşıolgusal adayı** — ikinci en iyi uygun seçeneği — sonraki değerlendirme için kaydeder.

> **GÖRSEL 4 — `04-benchmark.png`: Buraya ekle.**

Benchmark sayıları belirli bir yerel test ortamından yapılan ölçümlerdir; evrensel üretim garantileri değildir. Sağlayıcı gecikmesi, TLS, dayanıklılık ayarları, donanım ve eşzamanlılık uçtan uca sonuçları değiştirir.

---

## Yanıldığınızda Ne Olur

Her yönlendirme sistemi hata yapar. Soru bunları ölçüp ölçemeyeceğinizdir.

Calybris bir sonuç takip sistemi içerir. Bir karar icra edildikten ve güvenilir bir sonuç elde edildikten sonra — müşteri memnun kaldı, sözleşme incelemesi doğruydu veya destek bileti çözüldü — sonuç orijinal karar makbuzuna bağlanabilir.

Bilinen sunucu tarafı atama olasılıkları ve yeterli örtüşme olan trafik için değerlendirici önem ağırlıklandırması ve çift-dayanıklı politika-dışı tahmin kullanabilir. Bu varsayımlar karşılanmadığında Calybris karşıolgusal tahminin tanımlanmış olduğunu iddia etmez.

**Ne yapmaz**: politikayı otomatik olarak değiştirmez. Bu kasıtlıdır. Finansal bir sistemde otomatik politika optimizasyonu kaçak geri bildirim döngüleri yaratabilir. Calybris ölçer; kontrollü bir terfi süreci karar verir.

---

## Uygulamadan Önce Gölge

Bir maliyet yönetişim sisteminin yapabileceği en kötü şey ilk gün üretimi bozmaktır. Calybris bunu aşamalı dağıtımla çözer.

Gölge modunda başlarsınız. Motor istekleri değerlendirir ama önerilerini uygulamaz. Üretim trafiği değişmeden akar. Bu arada Calybris *ne yapacağını* kaydeder — hangi çağrıları düşüreceğini, hangilerini engelleyeceğini ve tahmini maliyet farkını.

> **GÖRSEL 5 — `05-shadow-production.png`: Buraya ekle.**

Yeterli temsili gölge trafiğinden sonra bir aday politika hazırlayabilirsiniz. Motor aktif ve aday paketleri karşılaştırır ve terfi öncesinde anlaşmazlıkları kaydeder.

Yalnızca aday yapılandırılmış geçitleri karşıladıktan sonra terfi ettirilmelidir. Aktif politika paketi atomik olarak değiştirilir ve önceki bir anlık görüntü geri alma için hazır kalır.

---

## Güvenlik Geçitleri

Bazı kararlar asla bir puanlama fonksiyonu tarafından verilmemelidir. Calybris politika ağırlıklarının geçersiz kılamayacağı sert sınırlar uygular:

- **Eşik üstü risk**: engellenir
- **Eşik altı güven**: engellenir
- **İş değerini aşan maliyet**: hiçbir ücretli model seçilmez
- **Sonlu olmayan girdiler**: değerlendirme öncesi reddedilir

Bu geçitler kapalı-başarısız çalışır. Motor bozuk girdi, eksik gerekli meta veri veya kullanılamayan bütçe alt sistemi nedeniyle bir isteği güvenle değerlendiremezse, isteğe sessizce izin vermez.

> **GÖRSEL 6 — `06-hardening.png`: Bölümün sonuna ekle.**

---

## Hayatta Kalmak İçin İnşa Edildi

Motor, proje kodunda hiçbir güvensiz blok olmadan Rust ile yazılmıştır. Yayımlanan test çalışmasında **231 test geçti, 0 başarısız oldu ve 3'ü kasıtlı olarak yok sayıldı**.

> **GÖRSEL 7 — `07-test-piramidi.png`: Giriş cümlesinin hemen altına ekle.**

- **Hata enjeksiyonu**: kesilmiş yazımlar ve bozuk kayıtlar yalnızca son geçerli WAL sınırına kadar kurtarılır.

> **GÖRSEL 8 — `08-wal-hata-testleri.png`: Hata enjeksiyonu maddesinin altına ekle.**

- **Özellik tabanlı test**: üretilen bütçe operasyon dizileri koruma ve negatif olmayan bakiye değişmezlerine karşı kontrol edilir.

> **GÖRSEL 9 — `09-proptest-budget.png`: Özellik tabanlı test maddesinin altına ekle.**

- **İndirgenmiş model eşzamanlılık testi**: Loom, indirgenmiş bir rezervasyon modelinin ilgili araya girmelerini keşfeder. Bu, tam üretim sistemindeki her zamanlama için bir kanıt değildir; modellenen eşzamanlılık değişmezinin odaklanmış bir kontrolüdür.

> **GÖRSEL 10 — `10-loom-thread-testleri.png`: Eşzamanlılık maddesinin altına ekle.**

- **Düşmanca girdiler**: NaN maliyetler, aşırı token sayıları, boş istekler ve hatalı biçimlendirilmiş JSON panik oluşturmadan reddedilir.

Kaydedilen geliştirme makinesinde, önceden derlenmiş test ikili dosyaları yaklaşık üç saniyede tamamlandı. Her test somut bir değişmezi adlandırır ve uygular.

> **GÖRSEL 11 — `11-test-suresi.png`: Test süresi cümlesinin altına ekle.**

---

## Açılış Sayfasının Arkasındaki Rakamlar

Örnek denetimimiz — 500.000 sentetik karar, yayımlanmış bir veri seti ve deterministik bir tohum — şunları gösteriyor:

- **İstenen taban çizgisi**: $4.796,52
- **GOVERIS politikası sonrası**: $3.196,55
- **Tahmini tasarruf oranı**: %33,36

Bu, sentetik bir iş yükü üzerindeki katalog tabanlı bir tahmindir, üretim tasarrufu garantisi değildir. Sonuç iş yükü dağılımına, model kataloğuna, politikaya ve fiyatlandırma anlık görüntüsüne bağlıdır. Bu yüzden ticari iddialardan önce gölge pilot gelir.

---

## Sırada Ne Var

Calybris, LLM iş yükleri çalıştıran ekipler için bir yapay zeka maliyet yönetişim ürünü olan [GOVERIS](https://emirhuseyin.tech/goveris/)'i güçlendirir.

LLM iş yükleri çalıştırıyorsanız ve harcama kararlarının nerede alındığını görmek istiyorsanız, yedi günlük gölge tekrar pilotları sunuyoruz: özel Docker dağıtımı, yalnızca meta veri gözlemi ve istem yakalama yok.

---

**Calybris Engine** — Teknik derinlik, mimari ve benchmark'lar:
[emirhuseyin.tech/calybris](https://emirhuseyin.tech/calybris/)

**GOVERIS** — Yapay zeka maliyet yönetişim ürünü, interaktif demo ve fiyatlandırma:
[emirhuseyin.tech/goveris](https://emirhuseyin.tech/goveris/)

**Portföy** — Tüm ekosistem, ürünler ve araştırma:
[emirhuseyin.tech](https://emirhuseyin.tech)

[emirhuseyininci@gmail.com](mailto:emirhuseyininci@gmail.com?subject=Calybris%20Sorgusu)
