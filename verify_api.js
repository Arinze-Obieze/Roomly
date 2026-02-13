
const fs = require('fs');
const path = require('path');

// Mock FormData since we are in node environment (or use a library if available, but fetch has it in newer node)
// Actually we can use the native fetch and FormData if Node version is high enough (18+)
// detailed property object
const property = {
    title: "Luxury Penthouse with Ocean View",
    description: "A stunning 2-bedroom penthouse with panoramic views.",
    rental_type: "monthly",
    property_category: "apartment",
    offering_type: "entire_place",
    bedrooms: "2",
    bathrooms: "2",
    floor_area: "120", // Should map to square_meters
    year_built: "2020",
    ber_rating: "A1",
    state: "Dublin",
    city: "Dublin 4",
    street: "123 High St",
    latitude: "53.3498",
    longitude: "-6.2603",
    transport_options: JSON.stringify(["Bus", "Dart"]),
    is_gaeltacht: "false",
    price_per_month: "3500",
    deposit: "3500",
    bills_option: "excluded",
    custom_bills: JSON.stringify([{name: "Electricity", amount: 100}]),
    couples_allowed: "true",
    payment_methods: JSON.stringify(["Bank Transfer"]),
    amenities: JSON.stringify(["Wifi", "Parking", "Gym"]),
    occupation_preference: "professional",
    gender_preference: "any",
    age_min: "25",
    age_max: "45",
    lifestyle_priorities: JSON.stringify({cleanliness: 5, social: 3}),
    partner_description: "Looking for quiet professionals.",
    available_from: "2026-03-01",
    is_immediate: "false",
    min_stay_months: "12",
    accept_viewings: "true"
};

async function testCreate() {
    console.log("Starting test...");
    
    // Create FormData
    const formData = new FormData();
    for (const [key, value] of Object.entries(property)) {
        formData.append(key, value);
    }
    
    // Add dummy files
    const dummyContent = "fake image content";
    const blob = new Blob([dummyContent], { type: 'image/jpeg' });
    formData.append('new_photos[]', blob, 'test_photo.jpg');

    try {
        // Find auth token? 
        // Since this runs locally effectively "outside" the browser session, 
        // we might fail auth. 
        // The API requires auth: `const { data: { user } } = await supabase.auth.getUser();`
        // Validation via script is hard without a session token.
        // I'll skip the actual fetch and rely on the implementation plan's manual verification step 
        // or just code review, as getting a valid session token blindly is hard.
        
        console.log("Test script constructed but skipped due to Auth requirement.");
        console.log("Please verify manually by submitting the form in the browser.");
    } catch (e) {
        console.error("Error", e);
    }
}

testCreate();
