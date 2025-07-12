export default function getFeaturedEventForToday() {
    const day = new Date().getDay();

    const eventMap = {
        0: {
            name: "Cell Sunday",
            image: require('../assets/default.png'),
            link: 'https://fatsoma.com/e/cell-sunday'
        },
        1: {
            name: "Unit 13 Mondays",
            image: require('../assets/unit13.jpg'),
            link: 'https://fatsoma.com/e/unit13-mondays'
        },
        2: {
            name: "Stealth Tuesdays",
            image: require('../assets/stealth.jpg'),
            link: 'https://fatsoma.com/e/stealth-tuesdays'
        },
        3: {
            name: "Ocean Wednesdays",
            image: require('../assets/roxy.jpg'),
            link: 'https://fatsoma.com/e/ocean-wednesdays'
        },
        4: {
            name: "Rock City Thursdays",
            image: require('../assets/ink.jpg'),
            link: 'https://fatsoma.com/e/rock-city-thursdays'
        },
        5: {
            name: "INK Fridays",
            image: require('../assets/pryzm.jpg'),
            link: 'https://fatsoma.com/e/ink-fridays'
        },
        6: {
            name: "SU Saturdays",
            image: require('../assets/mansion.jpg'),
            link: 'https://fatsoma.com/e/su-saturdays'
        },
    };

    return eventMap[day] || eventMap[0];
}
