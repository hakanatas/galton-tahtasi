# Galton Tahtası — Levha V

Düşen topların çivilere çarpıp binom dağılımı oluşturduğu interaktif bir olasılık makinesi.
"Etkileşimli Bilim Levhaları" serisinin beşinci levhası — eski bilim gravürlerinden esinlenen
kâğıt/mürekkep temasıyla, saf JavaScript.

**Canlı:** https://hakanatas.github.io/galton-tahtasi/

Seri: [Levha I — Periyodik Tablo](https://hakanatas.github.io/interactive-periodic-table/) ·
[Levha II — Nüklit Haritası](https://hakanatas.github.io/interactive-periodic-table/nuclides.html) ·
[Levha III — Fourier Çizim Makinesi](https://hakanatas.github.io/fourier-cizim-makinesi/) ·
[Levha IV — Yörünge Kurucu](https://hakanatas.github.io/yorunge-kurucu/)

## Nasıl çalışır?

Her top, çarptığı her çivide **p** olasılığıyla sağa, **1−p** olasılığıyla sola sapar. Tek bir
topun yolu tamamen rastlantısaldır; ama binlerce top biriktiğinde kovalar kendiliğinden bir
**çan eğrisi** çizer. Bu, Merkezi Limit Teoremi'nin görsel kanıtıdır: bağımsız rastgele adımların
toplamı normal dağılıma yakınsar.

## Özellikler

- 1 / 50 / 500 top bırakma veya **sürekli akış** modu; ayarlanabilir hız.
- **Sıra sayısı (n)** ve **sağa sapma olasılığı (p)** kaydırıcıları — n arttıkça eğri sivrilir,
  p değiştikçe tepe kayar.
- **Teorik binom eğrisi** histogramın üstüne canlı çizilir — deney ve teori birebir karşılaştırılır.
- Canlı istatistikler: gözlenen ortalama/standart sapma ve teorik μ = n·p, σ = √(n·p·(1−p)).
- Dokunmatik ekran ve mobil uyumlu.

## Çalıştırma

```bash
python3 -m http.server 8320
```
