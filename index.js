const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // HTML sitenin bu backend ile konuşabilmesi için şart
app.use(express.json());

// Şimdilik veritabanı yerine basit bir hafıza (RAM) kullanalım, telefonda kolay olsun.
// İleride burayı gerçek bir veritabanına bağlarsın.
let kullanicilar = [
  { id: "user_1", isim: "Ahmet", saat: "09", token: "ONESIGNAL_TOKEN_1" },
  { id: "user_2", isim: "Ayşe", saat: "14", token: "ONESIGNAL_TOKEN_2" }
];

// Cron-job.org'un her 10 dakikada bir tetikleyeceği link
app.get('/api/bildirim-kontrol', async (req, res) => {
    const simdi = new Date();
    // Türkiye saatine göre (UTC+3) saati ve dakikayı alıyoruz
    const trSaat = simdi.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit" });
    const trDakika = parseInt(simdi.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", minute: "2-digit" }));

    // Sunucu uyanık kalsın diye 10 dakikada bir istek gelecek ama
    // biz bildirimleri sadece saat başlarında (örn: 09:00 - 09:10 arası) bir kez tetikleyeceğiz.
    if (trDakika >= 0 && trDakika < 11) {
        console.log(`Saat ${trSaat}:00 kontrolü yapılıyor...`);

        // O saatte bildirimi olan kullanıcıları filtrele
        const Gidecekler = kullanicilar.filter(k => k.saat === trSaat);

        // OneSignal API'sine istek atma döngüsü
        for (let user of Gidecekler) {
            try {
                await fetch("https://onesignal.com/api/v1/notifications", {
                    method: "POST",
                    headers: {
                        "Authorization": "Basic ONESIGNAL_REST_API_KEY",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        app_id: "ONESIGNAL_APP_ID",
                        include_aliases: { "external_id": [user.id] },
                        target_channel: "push",
                        contents: { "tr": `Merhaba ${user.isim}, bugün tekrar etmen gereken flashcard'lar var! 🧠` }
                    })
                });
                console.log(`${user.isim} için bildirim tetiklendi.`);
            } catch (err) {
                console.error("OneSignal hatası:", err);
            }
        }
    }

    res.send({ durum: "Sunucu uyanık", saat: `${trSaat}:${trDakika}` });
});

// Yeni kullanıcı kaydı için HTML sayfasından buraya veri göndereceğiz
app.post('/api/kullanici-kaydet', (req, res) => {
    const { id, isim, saat, token } = req.body;
    kullanicilar.push({ id, isim, saat, token });
    res.send({ mesaj: "Başarıyla kaydedildi!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend ${PORT} portunda çalışıyor...`));
