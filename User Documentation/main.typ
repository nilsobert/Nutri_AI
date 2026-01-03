#import "@preview/grape-suite:3.1.0": seminar-paper, german-dates
#import "@preview/gentle-clues:1.2.0": *

#let button(content) = box(
  fill: rgb("#f0f0f0"),
  stroke: 0.5pt + gray,
  inset: (x: 4pt, y: 0pt),
  radius: 4pt,
  outset: (y: 2pt),
  content
)

#set text(lang: "en")

#show: seminar-paper.project.with(
    title: "Nutri-AI: User Guide",
    subtitle: "Your Personal Nutrition Companion",

    university: [Technical University Munich],
    faculty: [Product Documentation],
    institute: [User Experience Team],
    docent: [],
    seminar: [],

    submit-to: [],
    submit-by: [],

    semester: [],

    author: "Nutri-AI Team",
    email: "support@nutri-ai.com",
    address: [],

    show-declaration-of-independent-work: false,
    show-todolist: false
)

= Introduction
Welcome to *Nutri-AI*, your smart companion for a healthier lifestyle. Whether you are looking to lose weight, build muscle, or simply maintain a balanced diet, Nutri-AI makes tracking your nutrition effortless and accurate.

#info(title: "Why Nutri-AI?")[
  Forget manual entry. Nutri-AI uses advanced artificial intelligence to analyze your food from photos and voice descriptions, giving you instant nutritional data.
]

This guide will walk you through everything you need to know to get the most out of Nutri-AI.

= Getting Started

== Creating Your Account
When you launch Nutri-AI for the first time, you will be greeted by our Welcome Screen.

// SCREENSHOT: Login/Signup Screen. Please circle the "Sign Up" button.

To get started:
1. Tap on the #button[Sign Up] button.
2. Enter your email address and create a secure password.
3. Follow the on-screen prompts to complete your profile.

== Setting Your Goals
To provide personalized recommendations, Nutri-AI needs to know a bit about you. During setup, you will be asked for details such as your age, weight, height, and activity level. Based on this, the app calculates a daily calorie and macronutrient goal tailored specifically to you.

#tip(title: "Pro Tip")[
  You can always adjust these goals later in the #button[Settings] tab if your needs change.
]

= The Dashboard
Your *Home* screen is your daily command center. It gives you a quick snapshot of your progress for the day.

// SCREENSHOT: Home Screen. Please circle the Activity Rings (Calories, Protein, Carbs, Fat).

== Daily Summary
At the top of the screen, you will see your *Activity Rings*. These visual indicators show you exactly how many calories you have consumed and how much is remaining to hit your daily target.
- *Outer Ring:* Calories
- *Inner Rings:* Protein, Carbs, and Fat

Below the rings, you will find a list of your recent meals, allowing you to quickly review what you have eaten today.

= Logging Your Meals
Nutri-AI offers two powerful ways to log your food without typing a single word.

== Using the Camera
The easiest way to log a meal is to take a picture of it.

// SCREENSHOT: Camera View / Capture Screen.

1. Tap the #button[+ (Add)] button in the bottom navigation bar.
2. Select #button[Camera].
3. Point your camera at your food and snap a photo.
4. Our AI will analyze the image and identify the food items and their estimated portion sizes.

#tip[
  You can also upload a photo from your gallery by tapping the #button[Image] icon on the camera screen.
]

== Voice Logging & Context
In a rush? You can simply tell Nutri-AI what you ate.

1. Tap the #button[+ (Add)] button.
2. Select #button[Voice].
3. Say something like, "I had a grilled chicken salad with half an avocado and a glass of orange juice."

#info(title: "Adding Context")[
  Even when using the camera, you can add voice or text notes! For example, if you take a picture of a burger but remove the bun, you can say "I didn't eat the bun" and the AI will adjust the calories accordingly.
]

== Reviewing Your Meal
After capturing your meal via photo or voice, you will see a *Review Screen*.

// SCREENSHOT: Meal Review Modal showing the detected food items and calories.

Here, you can see the breakdown of what the AI detected.
- *Name & Calories:* Verify the food item.
- *Macros:* Check Protein, Carbs, and Fat.
- *Quality Score:* See how healthy this meal is.

If something looks off, you can easily edit the items or quantities before saving. Once you are happy, tap #button[Save] to add it to your daily log.

= Understanding Your Data
Nutri-AI provides deep insights into your eating habits. Navigate to the #button[Insights] tab to explore.

// SCREENSHOT: Insights Screen showing the bar charts.

== Trends & Charts
The Insights screen provides detailed charts showing your calorie and macronutrient intake over different periods (Day, Week, Month, Year). Use this to spot patterns in your diet.

== Meal Quality Score
Nutri-AI doesn't just track *how much* you eat, but *how well* you eat.

// SCREENSHOT: Quality Screen showing the score out of 10.

Tap on the #button[Quality] section to see your *Meal Quality Score*. This score (out of 10) rates the nutritional value of your meals based on nutrient density and how well they fit your goals.

== Streaks & Consistency
Consistency is key to building healthy habits. We track two types of streaks:

1. *Day Streak:* Consecutive days where you logged your meals.
2. *Goal Streak:* Consecutive days where you met your calorie goal (didn't under-eat or over-eat).

#warning(title: "Keep it going!")[
  To keep your streak alive, make sure to log your meals every day! Missing a day will reset your counter.
]

// SCREENSHOT: Streaks Screen showing the flame icon.

= Calendar & History
Want to look back at what you ate last Tuesday? The #button[Calendar] tab allows you to browse your entire meal history.

// SCREENSHOT: Calendar Screen.

Simply tap on a date to view your logs for that specific day. This is great for identifying patterns in your eating habits.

= Profile & Settings
The #button[Profile] tab is where you manage your account and preferences.

// SCREENSHOT: Profile/Settings Screen.

- *Update Weight:* Log your weight regularly to track your physical progress.
- *Edit Goals:* As your fitness journey evolves, your nutritional needs might change. Update your calorie and macro targets here.
- *Preferences:* Customize app settings to suit your needs.

= Conclusion
Nutri-AI is designed to be simple, smart, and supportive. By logging your meals consistently and reviewing your insights, you are taking a powerful step towards a healthier you.

#success(title: "We are here to help")[
  If you have any questions or need support, please contact our team at support\@nutri-ai.com.
]

Stay healthy!
