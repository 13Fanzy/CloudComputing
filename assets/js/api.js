export async function fetchDailyQuote() {
    try {
        const response = await fetch('https://quotes.liupurnomo.com/');
        if (!response.ok) throw new Error("Quote API Error");
        const data = await response.json();
        return data; 
    } catch (error) {
        console.warn("Quote fetch failed, using fallback.");
        return { quote: "Knowledge is power.", author: "Francis Bacon" };
    }
}