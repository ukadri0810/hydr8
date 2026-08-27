/* =========================================================
   HYDR8
   Local-first hydration PWA
========================================================= */

const STORAGE_KEY = "hydr8_data_v2";
const DATE_KEY = "hydr8_date_v2";

const DEFAULT_DATA = {
    name: "",
    goal: 3000,
    consumed: 0,

    drinks: [],

    presets: [
        { name: "Glass", amount: 250 },
        { name: "Bottle", amount: 500 },
        { name: "Gym Bottle", amount: 750 },
        { name: "Large Bottle", amount: 1000 }
    ],

    reminders: {
        enabled: false,
        mode: "interval",
        interval: 60,
        start: "08:00",
        end: "22:00",
        times: "08:00, 10:00, 12:30, 15:00, 18:00"
    },

    workout: false,
    unit: "ml",
    theme: "dark",
    history: {}
};

let data = loadData();
let reminderTimer = null;
let deferredInstallPrompt = null;


/* =========================================================
   BASIC HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function cloneDefaultData() {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}


function loadData() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return cloneDefaultData();
        }

        const parsed =
            JSON.parse(saved);

        return {
            ...cloneDefaultData(),
            ...parsed,

            reminders: {
                ...DEFAULT_DATA.reminders,
                ...(parsed.reminders || {})
            },

            presets:
                Array.isArray(parsed.presets)
                    ? parsed.presets
                    : cloneDefaultData().presets,

            drinks:
                Array.isArray(parsed.drinks)
                    ? parsed.drinks
                    : [],

            history:
                parsed.history || {}
        };

    } catch (error) {

        console.error(
            "HYDR8 storage error:",
            error
        );

        return cloneDefaultData();
    }
}


function saveData() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

    } catch (error) {

        console.error(
            "Could not save data:",
            error
        );

    }
}


function todayKey() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatAmount(ml) {

    if (data.unit === "oz") {

        return `${Math.round(
            ml / 29.5735
        )} oz`;

    }

    if (ml >= 1000) {

        const liters =
            ml / 1000;

        return `${liters % 1 === 0
            ? liters.toFixed(0)
            : liters.toFixed(1)} L`;
    }

    return `${Math.round(ml)} ml`;
}


function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        showToast.timeout
    );

    showToast.timeout =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 1800);
}



/* =========================================================
   SHEETS
========================================================= */

function openSheet(id) {

    const sheet = $(id);

    if (!sheet) {
        console.error(
            "Sheet not found:",
            id
        );
        return;
    }

    sheet.classList.remove("hidden");
}


function closeSheet(id) {

    const sheet = $(id);

    if (!sheet) return;

    sheet.classList.add("hidden");
}


document.addEventListener(
    "click",
    function(event) {

        const closeButton =
            event.target.closest(
                "[data-close]"
            );

        if (!closeButton) return;

        closeSheet(
            closeButton.dataset.close
        );
    }
);



/* =========================================================
   DAILY DATA
========================================================= */

function checkNewDay() {

    const today =
        todayKey();

    const previous =
        localStorage.getItem(
            DATE_KEY
        );


    if (!previous) {

        localStorage.setItem(
            DATE_KEY,
            today
        );

        return;
    }


    if (previous === today) {
        return;
    }


    if (
        data.drinks &&
        data.drinks.length
    ) {

        data.history[previous] =
            data.drinks.reduce(
                (total, drink) =>
                    total + Number(drink.amount || 0),
                0
            );
    }


    data.consumed = 0;

    data.drinks = [];


    localStorage.setItem(
        DATE_KEY,
        today
    );

    saveData();
}



/* =========================================================
   DATE / GREETING
========================================================= */

function renderDate() {

    const element =
        $("todayDate");

    if (!element) return;

    element.textContent =
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

    const element =
        $("greeting");

    if (!element) return;


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


    element.textContent =
        greeting;
}



/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    const goal =
        Math.max(
            Number(data.goal) || 3000,
            1
        );

    const consumed =
        Number(data.consumed) || 0;


    const percentage =
        Math.min(
            consumed / goal,
            1
        );


    const circumference =
        2 * Math.PI * 88;


    const offset =
        circumference -
        percentage * circumference;


    const progress =
        $("progressBar");

    if (progress) {

        progress.style.strokeDashoffset =
            offset;
    }


    const consumedElement =
        $("consumedAmount");

    if (consumedElement) {

        if (consumed >= 1000) {

            consumedElement.textContent =
                (consumed / 1000)
                    .toFixed(
                        consumed % 1000
                            ? 1
                            : 0
                    );

        } else {

            consumedElement.textContent =
                Math.round(consumed);
        }
    }


    const goalElement =
        $("goalAmount");

    if (goalElement) {

        goalElement.textContent =
            `/ ${formatAmount(goal)}`;
    }


    const remaining =
        Math.max(
            goal - consumed,
            0
        );


    const remainingElement =
        $("remainingAmount");

    if (remainingElement) {

        remainingElement.textContent =
            formatAmount(remaining);
    }


    const percentageElement =
        $("completionPercent");

    if (percentageElement) {

        percentageElement.textContent =
            Math.round(
                consumed / goal * 100
            ) + "%";
    }


    renderQuickButtons();
    renderActivity();
    renderWorkout();
    renderStreak();
    renderNextReminder();
}



/* =========================================================
   QUICK ADD
========================================================= */

function renderQuickButtons() {

    const container =
        $("quickGrid");

    if (!container) return;


    container.innerHTML = "";


    data.presets
        .slice(0, 4)
        .forEach(
            function(preset, index) {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "quick-button" +
                    (
                        index === 0
                            ? " primary"
                            : ""
                    );


                button.innerHTML = `
                    <strong>
                        ${
                            preset.amount >= 1000
                                ? (preset.amount / 1000) + " L"
                                : preset.amount
                        }
                    </strong>

                    <small>
                        ${preset.name}
                    </small>
                `;


                button.addEventListener(
                    "click",
                    function() {

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



/* =========================================================
   ADD WATER
========================================================= */

function addWater(amount) {

    amount =
        Number(amount);


    if (
        !amount ||
        amount <= 0
    ) {

        showToast(
            "Enter a valid amount."
        );

        return;
    }


    data.consumed += amount;


    data.drinks.unshift({

        amount: amount,

        time:
            new Date().toISOString()

    });


    data.history[todayKey()] =
        data.consumed;


    saveData();

    renderDashboard();

    closeSheet(
        "waterSheet"
    );


    showToast(
        `+ ${formatAmount(amount)}`
    );


    if (
        navigator.vibrate
    ) {

        navigator.vibrate(25);

    }
}



/* =========================================================
   WATER PRESETS
========================================================= */

function renderPresets() {

    const container =
        $("presetGrid");

    if (!container) return;


    container.innerHTML = "";


    data.presets.forEach(
        function(preset) {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

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
                function() {

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



/* =========================================================
   ACTIVITY
========================================================= */

function renderActivity() {

    const container =
        $("activityList");

    if (!container) return;


    const count =
        $("entryCount");


    if (count) {

        count.textContent =
            `${data.drinks.length} ${
                data.drinks.length === 1
                    ? "entry"
                    : "entries"
            }`;
    }


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
        .slice(0, 10)
        .forEach(
            function(drink) {

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

            }
        );
}



/* =========================================================
   WORKOUT
========================================================= */

function renderWorkout() {

    const toggle =
        $("workoutToggle");

    if (!toggle) return;


    toggle.classList.toggle(
        "active",
        data.workout
    );


    const title =
        $("workoutTitle");

    const description =
        $("workoutDescription");


    if (data.workout) {

        if (title) {

            title.textContent =
                "Workout mode is active.";
        }

        if (description) {

            description.textContent =
                "Hydration reminders are increased.";
        }

    } else {

        if (title) {

            title.textContent =
                "Ready when you are.";
        }

        if (description) {

            description.textContent =
                "Increase reminder frequency during training.";
        }
    }
}



/* =========================================================
   STREAK
========================================================= */

function renderStreak() {

    let streak = 0;

    const date =
        new Date();


    while (true) {

        const key =
            date.toISOString()
                .slice(0, 10);


        const amount =
            key === todayKey()
                ? data.consumed
                : Number(
                    data.history[key] || 0
                );


        if (
            amount >= data.goal
        ) {

            streak++;

            date.setDate(
                date.getDate() - 1
            );

        } else {

            break;

        }
    }


    const streakElement =
        $("streak");


    if (streakElement) {

        streakElement.textContent =
            `${streak} ${
                streak === 1
                    ? "day"
                    : "days"
            }`;
    }


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
        function(a, b) {

            return Number(b[1]) -
                Number(a[1]);

        }
    );


    const best =
        $("bestDay");


    if (best) {

        best.textContent =
            allDays[0] &&
            Number(allDays[0][1]) > 0

                ? formatAmount(
                    allDays[0][1]
                )

                : "—";
    }
}



/* =========================================================
   REMINDERS
========================================================= */

function renderNextReminder() {

    const element =
        $("nextReminder");

    if (!element) return;


    if (
        !data.reminders.enabled
    ) {

        element.textContent =
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
            String(
                data.reminders.times || ""
            )
            .split(",")
            .map(
                function(time) {
                    return time.trim();
                }
            )
            .filter(Boolean)
            .sort();


        let nextTime = null;


        for (
            let i = 0;
            i < times.length;
            i++
        ) {

            const parts =
                times[i]
                    .split(":")
                    .map(Number);


            if (
                parts.length !== 2 ||
                Number.isNaN(parts[0]) ||
                Number.isNaN(parts[1])
            ) {
                continue;
            }


            const minutes =
                parts[0] * 60 +
                parts[1];


            if (
                minutes >
                currentMinutes
            ) {

                nextTime =
                    times[i];

                break;
            }
        }


        element.textContent =
            nextTime ||
            times[0] ||
            "No times set";


        return;
    }


    const next =
        new Date(
            Date.now() +
            Number(
                data.reminders.interval
            ) *
            60000
        );


    element.textContent =
        next.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}



/* =========================================================
   NOTIFICATIONS
========================================================= */

async function requestNotifications() {

    if (
        !("Notification" in window)
    ) {

        showToast(
            "Notifications are not supported."
        );

        return false;
    }


    try {

        if (
            Notification.permission ===
            "default"
        ) {

            const permission =
                await Notification
                    .requestPermission();

            return permission ===
                "granted";
        }


        return (
            Notification.permission ===
            "granted"
        );

    } catch (error) {

        console.error(
            error
        );

        return false;
    }
}


async function showNotification() {

    const allowed =
        await requestNotifications();


    if (!allowed) {

        showToast(
            "Notification permission is required."
        );

        return false;
    }


    const message =
        data.workout

            ? "Training hydration check — take a drink."

            : "Hydration check — time for some water.";


    try {

        if (
            "serviceWorker" in navigator
        ) {

            const registration =
                await navigator
                    .serviceWorker
                    .ready;


            await registration.showNotification(
                "HYDR8",
                {
                    body: message,
                    icon: "",
                    badge: "",
                    tag: "hydr8-reminder",
                    renotify: true,
                    vibrate: [
                        200,
                        100,
                        200
                    ]
                }
            );

        } else {

            new Notification(
                "HYDR8",
                {
                    body: message
                }
            );

        }

        return true;

    } catch (error) {

        console.error(
            "Notification error:",
            error
        );

        return false;
    }
}



/* =========================================================
   TEST REMINDER
========================================================= */

async function testReminder() {

    const result =
        await showNotification();


    if (result) {

        playBeep();

        showToast(
            "Test reminder sent."
        );

    }
}



/* =========================================================
   SOUND
========================================================= */

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


        oscillator.type =
            "sine";


        oscillator.frequency.value =
            880;


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

    } catch (error) {

        console.log(
            "Audio unavailable."
        );
    }
}



/* =========================================================
   REMINDER TIMER
========================================================= */

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
        Number(
            data.reminders.interval
        ) || 60;


    if (data.workout) {

        minutes =
            Math.min(
                minutes,
                30
            );
    }


    reminderTimer =
        setTimeout(
            async function() {

                await showNotification();

                scheduleReminder();

            },
            minutes * 60000
        );
}



/* =========================================================
   GOAL
========================================================= */

function suggestGoal() {

    const weight =
        Number(
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


    $("goalResult").textContent =
        `Suggested target: ${
            formatAmount(goal)
        }`;
}


function saveGoal() {

    const goal =
        Number(
            $("goalInput").value
        );


    if (
        !goal ||
        goal < 500
    ) {

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



/* =========================================================
   REMINDER SETTINGS
========================================================= */

function loadReminderForm() {

    const enabled =
        $("reminderEnabled");

    const mode =
        $("reminderMode");

    const interval =
        $("reminderInterval");

    const start =
        $("reminderStart");

    const end =
        $("reminderEnd");

    const times =
        $("specificTimes");


    if (enabled) {
        enabled.checked =
            data.reminders.enabled;
    }

    if (mode) {
        mode.value =
            data.reminders.mode;
    }

    if (interval) {
        interval.value =
            data.reminders.interval;
    }

    if (start) {
        start.value =
            data.reminders.start;
    }

    if (end) {
        end.value =
            data.reminders.end;
    }

    if (times) {
        times.value =
            data.reminders.times;
    }
}


async function saveReminders() {

    data.reminders = {

        enabled:
            $("reminderEnabled").checked,

        mode:
            $("reminderMode").value,

        interval:
            Number(
                $("reminderInterval").value
            ),

        start:
            $("reminderStart").value,

        end:
            $("reminderEnd").value,

        times:
            $("specificTimes").value

    };


    saveData();


    if (
        data.reminders.enabled
    ) {

        await requestNotifications();
    }


    scheduleReminder();

    renderNextReminder();

    closeSheet(
        "reminderSheet"
    );


    showToast(
        "Reminder settings saved."
    );
}



/* =========================================================
   INSIGHTS
========================================================= */

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
                .slice(0, 10);


        const amount =
            key === todayKey()
                ? data.consumed
                : Number(
                    data.history[key] || 0
                );


        days.push([
            key,
            amount
        ]);
    }


    const average =
        days.reduce(
            function(sum, item) {

                return sum +
                    Number(item[1]);

            },
            0
        ) / 7;


    $("average7").textContent =
        formatAmount(
            Math.round(average)
        );


    $("goalDays").textContent =
        days.filter(
            function(item) {

                return (
                    Number(item[1]) >=
                    Number(data.goal)
                );

            }
        ).length;


    const best =
        [...days].sort(
            function(a, b) {

                return Number(b[1]) -
                    Number(a[1]);

            }
        )[0];


    $("bestMetric").textContent =
        best && Number(best[1]) > 0
            ? formatAmount(best[1])
            : "—";


    $("totalEntries").textContent =
        data.drinks.length;


    const history =
        $("historyList");


    history.innerHTML = "";


    days.forEach(
        function(item) {

            const key =
                item[0];

            const amount =
                item[1];


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


            history.appendChild(
                row
            );

        }
    );
}



/* =========================================================
   SETTINGS
========================================================= */

function loadSettingsForm() {

    $("nameInput").value =
        data.name || "";


    $("unitSelect").value =
        data.unit || "ml";


    $("themeSelect").value =
        data.theme || "dark";
}


function applyTheme() {

    document.body.classList.toggle(
        "light",
        data.theme === "light"
    );
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

    applyTheme();

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



/* =========================================================
   CREATE PRESET
========================================================= */

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


    if (
        !amount ||
        amount <= 0
    ) {

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


    $("presetName").value = "";

    $("presetAmount").value = "";


    closeSheet(
        "presetSheet"
    );


    showToast(
        "Bottle preset created."
    );
}



/* =========================================================
   EXPORT
========================================================= */

function exportData() {

    try {

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


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            function() {

                URL.revokeObjectURL(
                    url
                );

            },
            500
        );


        showToast(
            "Data exported."
        );

    } catch (error) {

        console.error(
            error
        );

        showToast(
            "Export failed."
        );
    }
}



/* =========================================================
   RESET
========================================================= */

function resetData() {

    const confirmed =
        window.confirm(
            "Reset all HYDR8 data stored on this phone?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        STORAGE_KEY
    );

    localStorage.removeItem(
        DATE_KEY
    );


    location.reload();
}



/* =========================================================
   PWA INSTALL
========================================================= */

window.addEventListener(
    "beforeinstallprompt",
    function(event) {

        event.preventDefault();

        deferredInstallPrompt =
            event;


        const card =
            $("installCard");


        if (card) {

            card.classList.remove(
                "hidden"
            );
        }
    }
);


async function installApp() {

    if (!deferredInstallPrompt) {

        showToast(
            "Use your browser menu to install HYDR8."
        );

        return;
    }


    deferredInstallPrompt.prompt();


    try {

        await deferredInstallPrompt
            .userChoice;

    } catch (error) {

        console.log(error);

    }


    deferredInstallPrompt =
        null;


    $("installCard")
        .classList
        .add("hidden");
}


window.addEventListener(
    "appinstalled",
    function() {

        $("installCard")
            .classList
            .add("hidden");

    }
);



/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {

    /* Install */

    const installButton =
        $("installButton");

    if (installButton) {

        installButton.onclick =
            installApp;
    }


    const dismissInstall =
        $("dismissInstall");

    if (dismissInstall) {

        dismissInstall.onclick =
            function() {

                $("installCard")
                    .classList
                    .add("hidden");

            };
    }


    /* Settings */

    const settingsButton =
        $("settingsButton");

    if (settingsButton) {

        settingsButton.onclick =
            function() {

                loadSettingsForm();

                openSheet(
                    "settingsSheet"
                );

            };
    }


    const navSettings =
        $("navSettings");

    if (navSettings) {

        navSettings.onclick =
            function() {

                loadSettingsForm();

                openSheet(
                    "settingsSheet"
                );

            };
    }


    /* Insights */

    const navInsights =
        $("navInsights");

    if (navInsights) {

        navInsights.onclick =
            function() {

                renderInsights();

                openSheet(
                    "insightSheet"
                );

            };
    }


    /* Goals */

    const navGoals =
        $("navGoals");

    if (navGoals) {

        navGoals.onclick =
            function() {

                $("goalInput").value =
                    data.goal;

                openSheet(
                    "goalSheet"
                );

            };
    }


    /* Add water */

    const openAddWater =
        $("openAddWater");

    if (openAddWater) {

        openAddWater.onclick =
            function() {

                renderPresets();

                openSheet(
                    "waterSheet"
                );

            };
    }


    /* Custom water */

    const addCustomWater =
        $("addCustomWater");

    if (addCustomWater) {

        addCustomWater.onclick =
            function() {

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

            };
    }


    /* Create preset */

    const createPreset =
        $("createPreset");

    if (createPreset) {

        createPreset.onclick =
            function() {

                closeSheet(
                    "waterSheet"
                );

                openSheet(
                    "presetSheet"
                );

            };
    }


    /* Save preset */

    const savePresetButton =
        $("savePreset");

    if (savePresetButton) {

        savePresetButton.onclick =
            savePreset;
    }


    /* Workout */

    const workoutToggle =
        $("workoutToggle");

    if (workoutToggle) {

        workoutToggle.onclick =
            function() {

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

            };
    }


    /* Reminders */

    const openReminders =
        $("openReminders");

    if (openReminders) {

        openReminders.onclick =
            function() {

                loadReminderForm();

                openSheet(
                    "reminderSheet"
                );

            };
    }


    const saveRemindersButton =
        $("saveReminders");

    if (saveRemindersButton) {

        saveRemindersButton.onclick =
            saveReminders;
    }


    const testReminderButton =
        $("testReminder");

    if (testReminderButton) {

        testReminderButton.onclick =
            testReminder;
    }


    /* Goal */

    const suggestGoalButton =
        $("suggestGoal");

    if (suggestGoalButton) {

        suggestGoalButton.onclick =
            suggestGoal;
    }


    const saveGoalButton =
        $("saveGoal");

    if (saveGoalButton) {

        saveGoalButton.onclick =
            saveGoal;
    }


    /* Settings save */

    const saveSettingsButton =
        $("saveSettings");

    if (saveSettingsButton) {

        saveSettingsButton.onclick =
            saveSettings;
    }


    /* Export */

    const exportButton =
        $("exportData");

    if (exportButton) {

        exportButton.onclick =
            exportData;
    }


    /* Reset */

    const resetButton =
        $("resetData");

    if (resetButton) {

        resetButton.onclick =
            resetData;
    }
}



/* =========================================================
   SERVICE WORKER
========================================================= */

function registerServiceWorker() {

    if (
        !("serviceWorker" in navigator)
    ) {

        return;
    }


    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    function(registration) {

                        console.log(
                            "HYDR8 service worker registered.",
                            registration.scope
                        );

                    }
                )
                .catch(
                    function(error) {

                        console.error(
                            "Service worker registration failed:",
                            error
                        );

                    }
                );

        }
    );
}



/* =========================================================
   START APP
========================================================= */

function initApp() {

    console.log(
        "HYDR8 starting..."
    );


    checkNewDay();

    applyTheme();

    renderDate();

    renderGreeting();

    renderDashboard();

    renderPresets();

    loadReminderForm();

    loadSettingsForm();

    setupEvents();

    scheduleReminder();


    console.log(
        "HYDR8 ready."
    );
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initApp
    );

} else {

    initApp();

}


registerServiceWorker();
