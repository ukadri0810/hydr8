/* =====================================================
   HYDR8
   Local-first hydration tracker
===================================================== */


const STORAGE_KEY = "hydr8_data";


const defaultData = {

    name: "",

    goal: 3000,

    consumed: 0,

    interval: 60,

    workoutMode: false,

    drinks: [],

    lastReminder: null

};


let data =
    JSON.parse(
        localStorage.getItem(STORAGE_KEY)
    ) || defaultData;


/* =====================================================
   SAVE
===================================================== */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}


/* =====================================================
   DAILY RESET
===================================================== */

function checkNewDay() {

    const today =
        new Date().toISOString().split("T")[0];

    const savedDate =
        localStorage.getItem("hydr8_date");

    if (savedDate !== today) {

        data.consumed = 0;

        data.drinks = [];

        data.lastReminder = null;

        localStorage.setItem(
            "hydr8_date",
            today
        );

        saveData();

    }

}


/* =====================================================
   DATE
===================================================== */

function updateDate() {

    const now = new Date();

    const dateText =
        now.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );

    document.getElementById(
        "currentDate"
    ).textContent = dateText;

}


/* =====================================================
   GREETING
===================================================== */

function updateGreeting() {

    const hour =
        new Date().getHours();

    let greeting;

    if (hour < 12) {

        greeting = "Good morning.";

    } else if (hour < 17) {

        greeting = "Keep your energy up.";

    } else {

        greeting = "Finish strong.";

    }

    if (data.name) {

        greeting =
            `${greeting} ${data.name}`;

    }

    document.getElementById(
        "greeting"
    ).textContent = greeting;

}


/* =====================================================
   RENDER
===================================================== */

function render() {

    const consumed =
        data.consumed;

    const goal =
        data.goal;

    const percentage =
        Math.min(
            consumed / goal,
            1
        );

    const circumference =
        2 * Math.PI * 98;

    const offset =
        circumference -
        percentage * circumference;


    document.getElementById(
        "consumed"
    ).textContent =
        consumed.toLocaleString();


    document.getElementById(
        "dailyGoal"
    ).textContent =
        `${goal.toLocaleString()} ml`;


    const remaining =
        Math.max(
            goal - consumed,
            0
        );


    document.getElementById(
        "remaining"
    ).textContent =
        `${remaining.toLocaleString()} ml`;


    document.getElementById(
        "progressRing"
    ).style.strokeDashoffset =
        offset;


    document.getElementById(
        "drinkCount"
    ).textContent =
        `${data.drinks.length} ${
            data.drinks.length === 1
                ? "drink"
                : "drinks"
        }`;


    renderActivity();

}


/* =====================================================
   ADD WATER
===================================================== */

function addWater(amount) {

    amount =
        parseInt(amount);

    if (!amount || amount <= 0) {

        return;

    }


    data.consumed += amount;


    data.drinks.unshift({

        amount,

        time:
            new Date().toISOString()

    });


    saveData();

    render();

    closeModal(
        "waterModal"
    );


    /* Small haptic feedback */

    if (
        navigator.vibrate
    ) {

        navigator.vibrate(25);

    }

}


/* =====================================================
   ACTIVITY
===================================================== */

function renderActivity() {

    const container =
        document.getElementById(
            "activityList"
        );


    if (!data.drinks.length) {

        container.innerHTML = `
            <div class="empty-state">
                No water logged yet.
            </div>
        `;

        return;

    }


    container.innerHTML =
        data.drinks
            .slice(0, 8)
            .map(drink => {

                const date =
                    new Date(
                        drink.time
                    );

                const time =
                    date.toLocaleTimeString(
                        "en-IN",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );


                return `

                    <div class="activity-item">

                        <span class="amount">
                            ${drink.amount} ml
                        </span>

                        <span class="time">
                            ${time}
                        </span>

                    </div>

                `;

            })
            .join("");

}


/* =====================================================
   MODALS
===================================================== */

function openModal(id) {

    document
        .getElementById(id)
        .classList.remove("hidden");

}

function closeModal(id) {

    document
        .getElementById(id)
        .classList.add("hidden");

}


/* =====================================================
   QUICK BUTTONS
===================================================== */

document
    .querySelectorAll(".water-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                addWater(
                    button.dataset.amount
                );

            }
        );

    });


/* =====================================================
   CUSTOM WATER
===================================================== */

document
    .getElementById("customAddBtn")
    .addEventListener(
        "click",
        () => {

            openModal(
                "waterModal"
            );

        }
    );


document
    .getElementById("addCustomWater")
    .addEventListener(
        "click",
        () => {

            const amount =
                document
                    .getElementById(
                        "customAmount"
                    )
                    .value;

            addWater(amount);

        }
    );


/* =====================================================
   SETTINGS
===================================================== */

document
    .getElementById("settingsBtn")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "nameInput"
                )
                .value =
                data.name || "";


            document
                .getElementById(
                    "goalInput"
                )
                .value =
                data.goal;


            document
                .getElementById(
                    "intervalInput"
                )
                .value =
                data.interval;


            openModal(
                "settingsModal"
            );

        }
    );


document
    .getElementById("saveSettings")
    .addEventListener(
        "click",
        () => {

            data.name =
                document
                    .getElementById(
                        "nameInput"
                    )
                    .value
                    .trim();


            data.goal =
                parseInt(
                    document
                        .getElementById(
                            "goalInput"
                        )
                        .value
                ) || 3000;


            data.interval =
                parseInt(
                    document
                        .getElementById(
                            "intervalInput"
                        )
                        .value
                ) || 60;


            saveData();

            updateGreeting();

            render();

            closeModal(
                "settingsModal"
            );

            scheduleReminder();

        }
    );


/* =====================================================
   WORKOUT MODE
===================================================== */

const workoutToggle =
    document.getElementById(
        "workoutToggle"
    );


function renderWorkoutMode() {

    workoutToggle.classList.toggle(
        "active",
        data.workoutMode
    );

}


workoutToggle.addEventListener(
    "click",
    () => {

        data.workoutMode =
            !data.workoutMode;

        saveData();

        renderWorkoutMode();

        scheduleReminder();

    }
);


/* =====================================================
   GOAL CALCULATOR
===================================================== */

document
    .getElementById("goalBtn")
    .addEventListener(
        "click",
        () => {

            openModal(
                "goalModal"
            );

        }
    );


document
    .getElementById("calculateGoal")
    .addEventListener(
        "click",
        () => {

            const weight =
                parseFloat(
                    document
                        .getElementById(
                            "weightInput"
                        )
                        .value
                );


            if (!weight || weight <= 0) {

                return;

            }


            /*
                Prototype formula:

                35ml × body weight

                This is only a starting
                point, not medical advice.
            */

            const suggested =
                Math.round(
                    weight * 35
                );


            document
                .getElementById(
                    "goalResult"
                )
                .textContent =
                `Suggested starting target: ${
                    suggested.toLocaleString()
                } ml/day`;


            data.goal =
                suggested;

            saveData();

            render();

        }
    );


/* =====================================================
   REMINDERS
===================================================== */

function scheduleReminder() {

    clearTimeout(
        window.hydrationTimer
    );


    let minutes =
        data.interval;


    /*
       During workout mode,
       remind more frequently.
    */

    if (
        data.workoutMode
    ) {

        minutes =
            Math.min(
                minutes,
                30
            );

    }


    const milliseconds =
        minutes *
        60 *
        1000;


    const next =
        new Date(
            Date.now() +
            milliseconds
        );


    document.getElementById(
        "nextReminder"
    ).textContent =
        next.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    window.hydrationTimer =
        setTimeout(
            triggerReminder,
            milliseconds
        );

}


async function triggerReminder() {

    sendNotification();

    playReminderSound();

    scheduleReminder();

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

async function requestNotificationPermission() {

    if (
        !("Notification" in window)
    ) {

        return;

    }


    if (
        Notification.permission ===
        "default"
    ) {

        await Notification.requestPermission();

    }

}


function sendNotification() {

    if (
        !("Notification" in window)
    ) {

        return;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        return;

    }


    const message =
        data.workoutMode
            ? "Training mode: take a drink of water."
            : "Time to hydrate.";


    try {

        new Notification(
            "HYDR8",
            {
                body: message,
                icon: "icon-192.png",
                badge: "icon-192.png"
            }
        );

    } catch (error) {

        console.log(
            "Notification error:",
            error
        );

    }

}


/* =====================================================
   SOUND
===================================================== */

function playReminderSound() {

    try {

        const audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();


        const oscillator =
            audioContext.createOscillator();


        const gain =
            audioContext.createGain();


        oscillator.type =
            "sine";


        oscillator.frequency.value =
            880;


        gain.gain.setValueAtTime(
            0.001,
            audioContext.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.15,
            audioContext.currentTime + 0.03
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.5
        );


        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );


        oscillator.start();

        oscillator.stop(
            audioContext.currentTime +
            0.5
        );

    } catch (error) {

        console.log(
            "Audio unavailable",
            error
        );

    }

}


/* =====================================================
   REMINDER BUTTON
===================================================== */

document
    .getElementById("reminderBtn")
    .addEventListener(
        "click",
        async () => {

            await requestNotificationPermission();

            scheduleReminder();

        }
    );


/* =====================================================
   INSTALL PWA
===================================================== */

let deferredPrompt = null;


window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();

        deferredPrompt =
            event;


        document
            .getElementById(
                "installBanner"
            )
            .classList.remove(
                "hidden"
            );

    }
);


document
    .getElementById("installBtn")
    .addEventListener(
        "click",
        async () => {

            if (!deferredPrompt) {

                return;

            }


            deferredPrompt.prompt();

            const result =
                await deferredPrompt.userChoice;


            console.log(
                "Install:",
                result.outcome
            );


            deferredPrompt =
                null;


            document
                .getElementById(
                    "installBanner"
                )
                .classList.add(
                    "hidden"
                );

        }
    );


document
    .getElementById("closeInstall")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "installBanner"
                )
                .classList.add(
                    "hidden"
                );

        }
    );


/* =====================================================
   MODAL CLOSE BUTTONS
===================================================== */

document
    .querySelectorAll(
        "[data-close]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closeModal(
                    button.dataset.close
                );

            }
        );

    });


/* =====================================================
   SERVICE WORKER
===================================================== */

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "service-worker.js"
                )
                .catch(
                    error =>
                        console.log(
                            "Service worker:",
                            error
                        )
                );

        }
    );

}


/* =====================================================
   INITIALIZE
===================================================== */

checkNewDay();

updateDate();

updateGreeting();

render();

renderWorkoutMode();

scheduleReminder();
