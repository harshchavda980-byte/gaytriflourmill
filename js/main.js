const languageData = {
  en: {
    heroTitle: "Trusted Salt Supplier in Nearby Areas",
    heroDesc: "Quality salt for homes, shops & industries",
    ctaBtn: "Call / WhatsApp Now"
  },
  hi: {
    heroTitle: "आसपास के क्षेत्रों में विश्वसनीय नमक आपूर्तिकर्ता",
    heroDesc: "घर, दुकान और उद्योग के लिए गुणवत्ता नमक",
    ctaBtn: "कॉल / व्हाट्सएप करें"
  },
  gu: {
    heroTitle: "નજીકના વિસ્તારોમાં વિશ્વસનીય મીઠું સપ્લાયર",
    heroDesc: "ઘર, દુકાન અને ઉદ્યોગ માટે ગુણવત્તાવાળું મીઠું",
    ctaBtn: "કોલ / વોટ્સએપ કરો"
  }
};

function changeLanguage() {
  const lang = document.getElementById("languageSwitcher").value;
  localStorage.setItem("siteLang", lang);

  document.querySelectorAll("[data-key]").forEach(el => {
    const key = el.getAttribute("data-key");
    el.innerText = languageData[lang][key];
  });
}

// Load saved language
window.onload = () => {
  const savedLang = localStorage.getItem("siteLang") || "en";
  document.getElementById("languageSwitcher").value = savedLang;
  changeLanguage();
};
