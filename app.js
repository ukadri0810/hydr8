/* =====================================================
   HYDR8
   Premium Local-First Hydration App
===================================================== */


/* =====================================================
   STORAGE
===================================================== */

const STORAGE_KEY = "HYDR8_DATA_V1";

const defaultData = {

    name: "",

    goal: 3000,

    consumed: 0,

    drinks: [],

    presets: [

        {
            name: "Glass",
            amount: 250
        },

        {
            name: "Bottle",
            amount: 500
        },

        {
            name: "Gym Bottle",
            amount: 750
        },

        {
            name: "Large Bottle",
            amount: 1000
        }

    ],

    reminders: {

        enabled: false,

        mode: "interval",

        interval: 60,

        start: "08:00",

        end: "22:00",

        times:
            "08:00, 10:00, 12:30, 15:00, 18:00"

    },

    workout: false,

    unit: "ml",

    theme: "dark",

    history: {}

};


let data = loadData();

let reminderTimer = null;

let deferredInstallPrompt = null;



/* =====================================================
   STORAGE FUNCTIONS
===================================================== */

function loadData() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );

        if (!saved) {

            return structuredClone(defaultData);

        }

        return {

            ...structuredClone(defaultData),

            ...saved,

            reminders: {

                ...defaultData.reminders,

                ...(saved.reminders || {})

            }

        };

    } catch {

        return structuredClone(defaultData);

    }

}


function saveData() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(data)

    );

}



/* =====================================================
   HELPERS
===================================================== */

function $(id) {

    return document.getElementById(id);

}


function todayKey() {

    return new Date()
        .toISOString()
        .slice(0,10);

}


function formatAmount(ml) {

    if (data.unit === "oz") {

        return `${Math.round(ml / 29.5735)} oz`;

    }


    if (ml >= 1000) {

        const liters =
            ml / 1000;

        return `${liters % 1 === 0
            ? liters.toFixed(0)
            : liters.toFixed(1)} L`;

    }


    return `${ml} ml`;

}


function showToast(message) {

    const toast =
        $("toast");

    toast.textContent =
        message;

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 1800);

}



/* =====================================================
   SHEETS
===================================================== */

function openSheet(id) {

    $(id).classList.remove("hidden");

}


function closeSheet(id) {

    $(id).classList.add("hidden");

}


document.addEventListener(
    "click",
    event => {

        const close =
            event.target.closest(
                "[data-close]"
            );

        if (close) {

            closeSheet(
                close.dataset.close
            );

        }

    }
);



/* =====================================================
   DAILY RESET
===================================================== */

function checkNewDay() {

    const today =
        todayKey();

    const previous =
        localStorage.getItem(
            STORAGE_KEY + "_DATE"
        );


    if (previous !== today) {

        if (
            previous &&
            data.drinks.length
        ) {

            data.history[previous] =
                data.drinks.reduce(
                    (total, drink) =>
                        total + drink.amount,
                    0
                );

        }


        data.consumed = 0;

        data.drinks = [];


        localStorage.setItem(
            STORAGE_KEY + "_DATE",
            today
        );


        saveData();

    }

}



/* =====================================================
   DATE + GREETING
===================================================== */

function renderDate() {

    $("todayDate").textContent =

        new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );

}


function renderGreeting() {

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

        greeting +=
            ` ${data.name}`;

    }


    $("greeting").textContent =
        greeting;

}



/* =====================================================
   MAIN DASHBOARD
===================================================== */

function renderDashboard() {

    const percentage =
        Math.min(
            data.consumed / data.goal,
            1
        );


    const circumference =
        2 * Math.PI * 88;


    const offset =
        circumference -
        percentage * circumference;


    $("progressBar")
        .style
        .strokeDashoffset =
        offset;


    $("consumedAmount").textContent =

        data.consumed >= 1000

            ? (data.consumed / 1000)
                .toFixed(
                    data.consumed % 1000
                        ? 1
                        : 0
                )

            : data.consumed;


    $("goalAmount").textContent =

        `/ ${formatAmount(data.goal)}`;


    const remaining =
        Math.max(
            data.goal -
            data.consumed,
            0
        );


    $("remainingAmount").textContent =
        formatAmount(remaining);


    $("completionPercent").textContent =

        Math.round(
            data.consumed /
            data.goal *
            100
        ) + "%";


    renderQuickButtons();

    renderActivity();

    renderWorkout();

    renderStreak();

    renderNextReminder();

}



/* =====================================================
   QUICK BUTTONS
===================================================== */

function renderQuickButtons() {

    const container =
        $("quickGrid");


    const presets =
        data.presets.slice(0,4);


    container.innerHTML = "";


    presets.forEach(
        (preset,index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "quick-button" +
                (index === 0
                    ? " primary"
                    : "");


            button.innerHTML = `

                <strong>
                    ${preset.amount >= 1000
                        ? preset.amount / 1000 + " L"
                        : preset.amount}
                </strong>

                <small>
                    ${preset.name}
                </small>

            `;


            button.addEventListener(
                "click",
                () => {

                    addWater(
                        preset.amount
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );

}



/* =====================================================
   ADD WATER
===================================================== */

function addWater(amount) {

    if (!amount || amount < 1) {

        return;

    }


    data.consumed += amount;


    data.drinks.unshift({

        amount,

        time:
            new Date().toISOString()

    });


    data.history[todayKey()] =
        data.consumed;


    saveData();

    renderDashboard();

    closeSheet("waterSheet");

    showToast(
        `+ ${formatAmount(amount)}`
    );


    if (
        navigator.vibrate
    ) {

        navigator.vibrate(20);

    }

}



/* =====================================================
   PRESETS
===================================================== */

function renderPresets() {

    const container =
        $("presetGrid");


    container.innerHTML = "";


    data.presets.forEach(
        preset => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "preset";


            button.innerHTML = `

                <strong>
                    ${preset.name}
                </strong>

                <small>
                    ${formatAmount(
                        preset.amount
                    )}
                </small>

            `;


            button.addEventListener(
                "click",
                () => {

                    addWater(
                        preset.amount
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );

}



/* =====================================================
   ACTIVITY
===================================================== */

function renderActivity() {

    const container =
        $("activityList");


    $("entryCount").textContent =

        `${data.drinks.length} ${
            data.drinks.length === 1
                ? "entry"
                : "entries"
        }`;


    if (!data.drinks.length) {

        container.innerHTML = `

            <div class="empty-state">

                Nothing logged yet.
                Start with your first drink.

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    data.drinks
        .slice(0,10)
        .forEach(drink => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "activity";


            const time =
                new Date(
                    drink.time
                ).toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            item.innerHTML = `

                <strong>
                    ${formatAmount(
                        drink.amount
                    )}
                </strong>

                <span>
                    ${time}
                </span>

            `;


            container.appendChild(
                item
            );

        });

}



/* =====================================================
   WORKOUT MODE
===================================================== */

function renderWorkout() {

    const toggle =
        $("workoutToggle");


    toggle.classList.toggle(
        "active",
        data.workout
    );


    if (data.workout) {

        $("workoutTitle")
            .textContent =
            "Workout mode is active.";

        $("workoutDescription")
            .textContent =
            "Reminders are increased during training.";

    } else {

        $("workoutTitle")
            .textContent =
            "Ready when you are.";

        $("workoutDescription")
            .textContent =
            "Increase reminder frequency during training.";

    }

}



/* =====================================================
   STREAK
===================================================== */

function renderStreak() {

    let streak = 0;

    const date =
        new Date();


    while (true) {

        const key =
            date
                .toISOString()
                .slice(0,10);


        const amount =
            key === todayKey()

                ? data.consumed

                : data.history[key] || 0;


        if (amount >= data.goal) {

            streak++;

            date.setDate(
                date.getDate() - 1
            );

        } else {

            break;

        }

    }


    $("streak").textContent =

        `${streak} ${
            streak === 1
                ? "day"
                : "days"
        }`;


    const allDays = [

        ...Object.entries(
            data.history
        ),

        [
            todayKey(),
            data.consumed
        ]

    ];


    allDays.sort(
        (a,b) =>
            b[1] - a[1]
    );


    $("bestDay").textContent =

        allDays[0]?.[1]

            ? formatAmount(
                allDays[0][1]
            )

            : "—";

}



/* =====================================================
   REMINDERS
===================================================== */

function renderNextReminder() {

    if (
        !data.reminders.enabled
    ) {

        $("nextReminder")
            .textContent =
            "Reminders are off";

        return;

    }


    if (
        data.reminders.mode ===
        "specific"
    ) {

        const now =
            new Date();

        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();


        const times =
            data.reminders.times

                .split(",")

                .map(
                    time =>
                        time.trim()
                )

                .filter(Boolean)

                .sort();


        const next =
            times.find(
                time => {

                    const [
                        hour,
                        minute
                    ] =
                        time
                            .split(":")
                            .map(Number);

                    return (
                        hour * 60 +
                        minute
                    ) > currentMinutes;

                }
            );


        $("nextReminder")
            .textContent =
            next ||
            times[0] ||
            "No times set";


        return;

    }


    const next =
        new Date(
            Date.now() +
            data.reminders.interval *
            60000
        );


    $("nextReminder")
        .textContent =

        next.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

}



/* =====================================================
   NOTIFICATION
===================================================== */

async function requestNotifications() {

    if (
        !("Notification" in window)
    ) {

        showToast(
            "Notifications aren't supported."
        );

        return false;

    }


    if (
        Notification.permission ===
        "default"
    ) {

        await Notification.requestPermission();

    }


    return (
        Notification.permission ===
        "granted"
    );

}


async function testNotification() {

    const allowed =
        await requestNotifications();


    if (!allowed) {

        showToast(
            "Notification permission denied."
        );

        return;

    }


    new Notification(
        "HYDR8",
        {

            body:
                data.workout

                    ? "Training hydration check — take a drink."

                    : "Hydration check — time for some water."

        }
    );


    playBeep();

    showToast(
        "Test reminder sent."
    );

}



/* =====================================================
   SOUND
===================================================== */

function playBeep() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {

            return;

        }


        const context =
            new AudioContext();


        const oscillator =
            context.createOscillator();


        const gain =
            context.createGain();


        oscillator.frequency.value =
            880;


        oscillator.type =
            "sine";


        gain.gain.setValueAtTime(
            0.001,
            context.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.12,
            context.currentTime + 0.03
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            context.currentTime + 0.45
        );


        oscillator.connect(gain);

        gain.connect(
            context.destination
        );


        oscillator.start();

        oscillator.stop(
            context.currentTime + 0.45
        );

    } catch {

        // Audio unavailable.

    }

}



/* =====================================================
   REMINDER SCHEDULER
===================================================== */

function scheduleReminder() {

    clearTimeout(
        reminderTimer
    );


    if (
        !data.reminders.enabled
    ) {

        return;

    }


    let minutes =
        data.reminders.interval;


    if (data.workout) {

        minutes =
            Math.min(
                minutes,
                30
            );

    }


    reminderTimer =
        setTimeout(
            async () => {

                await testBackgroundReminder();

                scheduleReminder();

            },

            minutes * 60000

        );

}


async function testBackgroundReminder() {

    const allowed =
        await requestNotifications();


    if (allowed) {

        new Notification(
            "HYDR8",
            {

                body:
                    data.workout

                        ? "Training hydration check — take a drink."

                        : "Hydration check — drink some water."

            }
        );

    }


    playBeep();

}



/* =====================================================
   GOAL
===================================================== */

function suggestGoal() {

    const weight =
        parseFloat(
            $("weightInput").value
        );


    if (!weight) {

        showToast(
            "Enter your body weight first."
        );

        return;

    }


    const activity =
        $("activityLevel").value;


    const workout =
        Number(
            $("workoutMinutes").value
        ) || 0;


    let goal =
        weight * 35;


    if (
        activity === "moderate"
    ) {

        goal += 300;

    }


    if (
        activity === "high"
    ) {

        goal += 500;

    }


    goal +=
        Math.min(
            workout * 5,
            500
        );


    goal =
        Math.round(
            goal / 50
        ) * 50;


    $("goalInput").value =
        goal;


    $("goalResult")
        .textContent =

        `Suggested target: ${
            formatAmount(goal)
        }`;

}


function saveGoal() {

    const goal =
        Number(
            $("goalInput").value
        );


    if (!goal || goal < 500) {

        showToast(
            "Enter a valid goal."
        );

        return;

    }


    data.goal =
        goal;


    saveData();

    renderDashboard();

    closeSheet(
        "goalSheet"
    );

    showToast(
        "Daily goal updated."
    );

}



/* =====================================================
   REMINDER SETTINGS
===================================================== */

function loadReminderForm() {

    $("reminderEnabled")
        .checked =
        data.reminders.enabled;


    $("reminderMode")
        .value =
        data.reminders.mode;


    $("reminderInterval")
        .value =
        data.reminders.interval;


    $("reminderStart")
        .value =
        data.reminders.start;


    $("reminderEnd")
        .value =
        data.reminders.end;


    $("specificTimes")
        .value =
        data.reminders.times;

}


function saveReminders() {

    data.reminders = {

        enabled:
            $("reminderEnabled")
                .checked,

        mode:
            $("reminderMode")
                .value,

        interval:
            Number(
                $("reminderInterval")
                    .value
            ),

        start:
            $("reminderStart")
                .value,

        end:
            $("reminderEnd")
                .value,

        times:
            $("specificTimes")
                .value

    };


    saveData();

    scheduleReminder();

    renderNextReminder();

    closeSheet(
        "reminderSheet"
    );

    showToast(
        "Reminder settings saved."
    );

}



/* =====================================================
   INSIGHTS
===================================================== */

function renderInsights() {

    const days = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date();


        date.setDate(
            date.getDate() - i
        );


        const key =
            date
                .toISOString()
                .slice(0,10);


        const amount =
            key === todayKey()

                ? data.consumed

                : data.history[key] || 0;


        days.push([
            key,
            amount
        ]);

    }


    const average =
        days.reduce(
            (sum,item) =>
                sum + item[1],
            0
        ) / 7;


    $("average7")
        .textContent =
        formatAmount(
            Math.round(average)
        );


    $("goalDays")
        .textContent =
        days.filter(
            item =>
                item[1] >= data.goal
        ).length;


    const best =
        [...days].sort(
            (a,b) =>
                b[1] - a[1]
        )[0];


    $("bestMetric")
        .textContent =
        best[1]
            ? formatAmount(best[1])
            : "—";


    $("totalEntries")
        .textContent =
        Object.keys(
            data.history
        ).length +
        data.drinks.length;


    $("historyList")
        .innerHTML = "";


    days.forEach(
        ([key,amount]) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "history-row";


            const date =
                new Date(
                    key + "T12:00:00"
                );


            row.innerHTML = `

                <span>
                    ${date.toLocaleDateString(
                        "en-IN",
                        {
                            weekday: "short",
                            day: "numeric",
                            month: "short"
                        }
                    )}
                </span>

                <strong>
                    ${formatAmount(amount)}
                </strong>

            `;


            $("historyList")
                .appendChild(row);

        }
    );

}



/* =====================================================
   SETTINGS
===================================================== */

function loadSettingsForm() {

    $("nameInput").value =
        data.name;


    $("unitSelect").value =
        data.unit;


    $("themeSelect").value =
        data.theme;

}


function saveSettings() {

    data.name =
        $("nameInput")
            .value
            .trim();


    data.unit =
        $("unitSelect")
            .value;


    data.theme =
        $("themeSelect")
            .value;


    saveData();

    renderDate();

    renderGreeting();

    renderDashboard();

    closeSheet(
        "settingsSheet"
    );

    showToast(
        "Settings saved."
    );

}



/* =====================================================
   CREATE PRESET
===================================================== */

function savePreset() {

    const name =
        $("presetName")
            .value
            .trim();


    const amount =
        Number(
            $("presetAmount")
                .value
        );


    if (!amount) {

        showToast(
            "Enter a valid amount."
        );

        return;

    }


    data.presets.push({

        name:
            name ||
            "My Bottle",

        amount

    });


    saveData();

    renderDashboard();

    renderPresets();

    closeSheet(
        "presetSheet"
    );

    showToast(
        "Bottle preset created."
    );

}



/* =====================================================
   EXPORT
===================================================== */

function exportData() {

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `hydr8-${todayKey()}.json`;


    link.click();


    URL.revokeObjectURL(
        url
    );

}



/* =====================================================
   RESET
===================================================== */

function resetData() {

    const confirmed =
        confirm(
            "Reset all HYDR8 data stored on this phone?"
        );


    if (!confirmed) {

        return;

    }


    localStorage.removeItem(
        STORAGE_KEY
    );


    location.reload();

}



/* =====================================================
   INSTALL PWA
===================================================== */

window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();

        deferredInstallPrompt =
            event;


        $("installCard")
            .classList
            .remove("hidden");

    }
);


$("installButton")
    .addEventListener(
        "click",
        async () => {

            if (!deferredInstallPrompt) {

                return;

            }


            deferredInstallPrompt
                .prompt();


            await deferredInstallPrompt
                .userChoice;


            deferredInstallPrompt =
                null;


            $("installCard")
                .classList
                .add("hidden");

        }
    );


$("dismissInstall")
    .addEventListener(
        "click",
        () => {

            $("installCard")
                .classList
                .add("hidden");

        }
    );


window.addEventListener(
    "appinstalled",
    () => {

        $("installCard")
            .classList
            .add("hidden");

    }
);



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
                        console.error(
                            "Service worker:",
                            error
                        )
                );

        }
    );

}



/* =====================================================
   EVENT LISTENERS
===================================================== */


/* Add water */

$("openAddWater")
    .addEventListener(
        "click",
        () => {

            renderPresets();

            openSheet(
                "waterSheet"
            );

        }
    );


/* Custom water */

$("addCustomWater")
    .addEventListener(
        "click",
        () => {

            const amount =
                Number(
                    $("customWater")
                        .value
                );


            if (!amount) {

                showToast(
                    "Enter an amount."
                );

                return;

            }


            addWater(amount);

            $("customWater")
                .value = "";

        }
    );


/* Create preset */

$("createPreset")
    .addEventListener(
        "click",
        () => {

            closeSheet(
                "waterSheet"
            );

            openSheet(
                "presetSheet"
            );

        }
    );


/* Save preset */

$("savePreset")
    .addEventListener(
        "click",
        savePreset
    );


/* Workout */

$("workoutToggle")
    .addEventListener(
        "click",
        () => {

            data.workout =
                !data.workout;


            saveData();

            renderWorkout();

            scheduleReminder();

            showToast(
                data.workout
                    ? "Workout mode on."
                    : "Workout mode off."
            );

        }
    );


/* Reminders */

$("openReminders")
    .addEventListener(
        "click",
        () => {

            loadReminderForm();

            openSheet(
                "reminderSheet"
            );

        }
    );


$("saveReminders")
    .addEventListener(
        "click",
        saveReminders
    );


$("testReminder")
    .addEventListener(
        "click",
        testNotification
    );


/* Goals */

$("navGoals")
    .addEventListener(
        "click",
        () => {

            $("goalInput").value =
                data.goal;

            openSheet(
                "goalSheet"
            );

        }
    );


$("suggestGoal")
    .addEventListener(
        "click",
        suggestGoal
    );


$("saveGoal")
    .addEventListener(
        "click",
        saveGoal
    );


/* Insights */

$("navInsights")
    .addEventListener(
        "click",
        () => {

            renderInsights();

            openSheet(
                "insightSheet"
            );

        }
    );


/* Settings */

function openSettings() {

    loadSettingsForm();

    openSheet(
        "settingsSheet"
    );

}


$("settingsButton")
    .addEventListener(
        "click",
        openSettings
    );


$("navSettings")
    .addEventListener(
        "click",
        openSettings
    );


$("saveSettings")
    .addEventListener(
        "click",
        saveSettings
    );


$("exportData")
    .addEventListener(
        "click",
        exportData
    );


$("resetData")
    .addEventListener(
        "click",
        resetData
    );



/* =====================================================
   INITIALIZATION
===================================================== */

checkNewDay();

renderDate();

renderGreeting();

renderDashboard();

renderPresets();

loadReminderForm();

loadSettingsForm();

scheduleReminder();
