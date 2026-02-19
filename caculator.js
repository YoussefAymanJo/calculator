let usageChart; 
let currentTemperature = 25;
const locationCoords = {
    alexandria: { lat: 31.2001, lng: 29.9187 },
    aswan: { lat: 24.0889, lng: 32.8998 },
    asyut: { lat: 27.1810, lng: 31.1837 },
    beheira: { lat: 31.0364, lng: 30.4698 }, // Near Damanhur
    beni_suef: { lat: 29.0744, lng: 31.0979 },
    cairo: { lat: 30.0444, lng: 31.2357 },
    dakahlia: { lat: 31.0364, lng: 31.3807 }, // Near Mansoura
    damietta: { lat: 31.4165, lng: 31.8133 },
    faiyum: { lat: 29.3084, lng: 30.8428 },
    gharbia: { lat: 30.7865, lng: 31.0004 }, // Near Tanta
    giza: { lat: 30.0131, lng: 31.2089 },
    ismailia: { lat: 30.5965, lng: 32.2715 },
    kafr_el_sheikh: { lat: 31.1107, lng: 30.9388 },
    luxor: { lat: 25.6872, lng: 32.6396 },
    matrouh: { lat: 31.3525, lng: 27.2373 },
    minya: { lat: 28.1099, lng: 30.7503 },
    monufia: { lat: 30.5972, lng: 30.9876 }, // Near Shibin El Kom
    new_valley: { lat: 25.4390, lng: 30.5586 }, // Near Kharga
    north_sinai: { lat: 31.1316, lng: 33.7984 }, // Near El Arish
    port_said: { lat: 31.2565, lng: 32.2841 },
    qalyubia: { lat: 30.4066, lng: 31.1846 }, // Near Banha
    qena: { lat: 26.1615, lng: 32.7181 },
    red_sea: { lat: 27.2579, lng: 33.8116 }, // Near Hurghada
    sharqia: { lat: 30.5877, lng: 31.5020 }, // Near Zagazig
    sohag: { lat: 26.5570, lng: 31.6948 },
    south_sinai: { lat: 28.2364, lng: 33.6254 }, // Near El Tor
    suez: { lat: 29.9668, lng: 32.5498 }
};

async function fetchTemperature(lat, lng) {
    const weatherInfoLabel = document.getElementById('weather-info');
    weatherInfoLabel.innerText = "Fetching current temperature...";
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m`);
        const data = await response.json();
        if (data && data.current && data.current.temperature_2m) {
            currentTemperature = data.current.temperature_2m;
            weatherInfoLabel.innerText = `Current API Temp: ${currentTemperature}°C`;
            window.calculateWater(); 
        } else {
            weatherInfoLabel.innerText = `Using estimated Temp: ${currentTemperature}°C`;
        }
    } catch (error) {
        console.error("Error fetching weather:", error);
        weatherInfoLabel.innerText = `Weather API unavailable. Using ${currentTemperature}°C`;
    }
}
window.handleLocationChange = function() {
    const locKey = document.getElementById('Location').value;
    const coords = locationCoords[locKey] || locationCoords['other'];
    fetchTemperature(coords.lat, coords.lng);
};

window.toggleFields = function() {
    const type = document.getElementById('userType').value;
    const hasGarden = document.getElementById('has-garden').value;
    document.querySelectorAll('.household-field').forEach(el => el.style.display = type === 'household' ? 'flex' : 'none');
    document.querySelectorAll('.org-field').forEach(el => el.style.display = type === 'organization' ? 'flex' : 'none');
    document.querySelectorAll('.garden-field').forEach(el => el.style.display = hasGarden === 'yes' ? 'flex' : 'none');
    window.calculateWater();
};
window.calculateWater = function() {
    const type = document.getElementById('userType').value;
    const bathrooms = parseInt(document.getElementById('bathrooms').value) || 0;
    const kitchens = parseInt(document.getElementById('kitchens').value) || 0;
    const hasGarden = document.getElementById('has-garden').value;
    const gardenArea = parseInt(document.getElementById('gardenArea').value) || 0;
    let members = 0;
    if (type === 'household') {
        members = parseInt(document.getElementById('familyMembers').value) || 0;
    } else if (type === 'organization') {
        const employees = parseInt(document.getElementById('employees').value) || 0;
        const customers = parseInt(document.getElementById('customers').value) || 0;
        members = employees + customers;
    }
    let bathroomUsage = bathrooms * members * 50; 
    let kitchenUsage = kitchens * members * 30;   
    let gardenUsage = 0;
    if (hasGarden === 'yes' && gardenArea > 0) {
        let baseWatering = gardenArea * 4; 
        let tempMultiplier = 1.0;
        if (currentTemperature > 35) tempMultiplier = 1.5;
        else if (currentTemperature > 28) tempMultiplier = 1.2;
        else if (currentTemperature < 20) tempMultiplier = 0.7;
        gardenUsage = Math.round(baseWatering * tempMultiplier);
    }
    const total = bathroomUsage + kitchenUsage + gardenUsage;
    document.getElementById('resultText').innerText = `${total} Liters / Day`;
    updateChart([bathroomUsage, kitchenUsage, gardenUsage]);
};
function updateChart(data) {
    const ctx = document.getElementById('usageChart').getContext('2d');
    
    if (usageChart) {
        usageChart.data.datasets[0].data = data;
        usageChart.update();
    } else {
        usageChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Bathrooms', 'Kitchens', 'Garden'],
                datasets: [{
                    data: data,
                    backgroundColor: ['#0ea5e9', '#3b82f6', '#34d399'], 
                    borderColor: '#020617',
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: '#e5e7eb', 
                            font: { family: 'Poppins' },
                            padding: 15
                        }
                    }
                }
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.toggleFields();
    window.handleLocationChange(); // Fetch initial temp for default location
});