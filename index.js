const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Basit kullanıcı hafızası
let kullanicilar = [
  { id: "test_user_1", isim: "Burak", saat: "09", token: "test" }
];

// Cron-job.org'un her 10 dakikada bir tetikleyeceği link
app.get('/api/bildirim-kontrol', async (req, res) => {
    const simdi = new Date();
    const trSaat = simdi.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit" });
    const trDakika = parseInt(simdi.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", minute: "2-digit" }));

    // Sunucu uyanık kalsın diye 10 dakikada bir istek gelecek ama
    // biz bildirimleri sadece saat başlarında (örn: 09:00 - 09:10 arası) tetikleyeceğiz.
    if (trDakika >= 0 && trDakika < 11) {
        console.log(`Saat ${trSaat}:00 kontrolü yapılıyor...`);

        const Gidecekler = kullanicilar.filter(k => k.saat === trSaat);

        for (let user of Gidecekler) {
            try {
                await fetch("https://onesignal.com/api/v1/notifications", {
                    method: "POST",
                    headers: {
                        "Authorization": "Basic Os_v2_app_lttbhvt46zdafd43vbhlfshosdje2ufzosre2ynvbxe5ckjhg7m6s27kf4j5ao2asvcuj6ehfj6wd6bh2pdfe3s3a77nzpsl2acaonq",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        app_id: "5ce613d6-7cf6-4602-8f9b-a84eb2c8ee90",
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
    const { id, isim, saat } = req.body;
    kullanicilar.push({ id, isim, saat });
    res.send({ mesaj: "Başarıyla kaydedildi!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend ${PORT} portunda çalışıyor...`));
