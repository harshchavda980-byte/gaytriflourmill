const languageData = {
  en: {
    heroTitle: "Trusted Salt Supplier in Nearby Areas",
    heroDesc: "Providing quality salt for homes, shops and industries with timely delivery.",
    heroBtn: "Call / WhatsApp Now",
    aboutTitle: "About Gaytri Flour Mill",
    aboutDesc: "Gaytri Flour Mill is a locally trusted name in salt supply, serving nearby regions with quality products, fair pricing and reliable service.",
    card1Title: "Quality Salt",
    card1Desc: "Pure and well-processed salt for daily and industrial use.",
    card2Title: "Bulk Supply",
    card2Desc: "25kg, 50kg and bulk orders available at best rates.",
    card3Title: "Local Delivery",
    card3Desc: "Fast and reliable delivery across nearby areas.",
    ctaTitle: "Need a Reliable Salt Supplier?",
    ctaDesc: "Contact us today for bulk orders and regular supply.",
    ctaBtn: "Get in Touch"
  },
  hi: {
    heroTitle: "आसपास के क्षेत्रों में विश्वसनीय नमक आपूर्तिकर्ता",
    heroDesc: "घर, दुकान और उद्योग के लिए गुणवत्ता नमक की आपूर्ति।",
    heroBtn: "कॉल / व्हाट्सएप करें",
    aboutTitle: "गायत्री फ्लोर मिल के बारे में",
    aboutDesc: "गायत्री फ्लोर मिल एक भरोसेमंद स्थानीय नमक आपूर्तिकर्ता है।",
    card1Title: "गुणवत्ता नमक",
    card1Desc: "दैनिक और औद्योगिक उपयोग के लिए शुद्ध नमक।",
    card2Title: "थोक आपूर्ति",
    card2Desc: "25kg, 50kg और थोक ऑर्डर उपलब्ध।",
    card3Title: "स्थानीय डिलीवरी",
    card3Desc: "तेज और भरोसेमंद डिलीवरी सेवा।",
    ctaTitle: "भरोसेमंद नमक चाहिए?",
    ctaDesc: "आज ही संपर्क करें।",
    ctaBtn: "संपर्क करें"
  },
  gu: {
    heroTitle: "નજીકના વિસ્તારોમાં વિશ્વસનીય મીઠું સપ્લાયર",
    heroDesc: "ઘર, દુકાન અને ઉદ્યોગ માટે ગુણવત્તાવાળું મીઠું.",
    heroBtn: "કોલ / વોટ્સએપ કરો",
    aboutTitle: "ગાયત્રી ફ્લોર મિલ વિશે",
    aboutDesc: "ગાયત્રી ફ્લોર મિલ એક વિશ્વસનીય સ્થાનિક મીઠું સપ્લાયર છે.",
    card1Title: "ગુણવત્તાવાળું મીઠું",
    card1Desc: "દૈનિક અને ઔદ્યોગિક ઉપયોગ માટે શુદ્ધ મીઠું.",
    card2Title: "થોક સપ્લાય",
    card2Desc: "25kg, 50kg અને થોક ઓર્ડર ઉપલબ્ધ.",
    card3Title: "સ્થાનિક ડિલિવરી",
    card3Desc: "ઝડપી અને વિશ્વસનીય સેવા.",
    ctaTitle: "વિશ્વસનીય મીઠું જોઈએ છે?",
    ctaDesc: "આજે જ સંપર્ક કરો.",
    ctaBtn: "સંપર્ક કરો"
  }
};

function changeLanguage() {
  const lang = document.getElementById("languageSwitcher").value;
  localStorage.setItem("lang", lang);

  document.querySelectorAll("[data-key]").forEach(el => {
    el.innerText = languageData[lang][el.dataset.key];
  });
}

window.onload = () => {
  const savedLang = localStorage.getItem("lang") || "en";
  document.getElementById("languageSwitcher").value = savedLang;
  changeLanguage();
};

/* Scroll animation */
const fadeElements = document.querySelectorAll(".fade-up");
window.addEventListener("scroll", () => {
  fadeElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      el.classList.add("show");
    }
  });
});
