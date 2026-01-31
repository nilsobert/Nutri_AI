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

    author: "Eduardo Pinto, Manuel Muhelberger",
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

To get started:
1. Tap on the #button[Sign Up] button.
2. Enter your email address and create a secure password.
3. Follow the on-screen prompts to complete your profile.


== Setting Your Goals
To provide personalized recommendations, Nutri-AI needs to know a bit about you. During setup, you will be asked for details such as your *Age*, *Weight*, *Height*, *Activity Level*, and your *Main Goal* with this app. Based on this, the app calculates a daily calorie and macronutrient goal tailored specifically to you.

#tip(title: "Pro Tip")[
  You can always adjust these goals later in the #button[Settings] tab if your needs change.
]

#table(
  columns: 4,
  stroke: none,
  inset: 5pt,
  align: center,
  [
    #image("signup_page.PNG", width: 80%)
  ],
  [
    #image("info_page.PNG", width: 80%)
  ],
  [
    #image("motivation.png", width: 80%)
  ],
  [
    #image("main_goal.png", width: 80%)
  ]
)


= The Dashboard
Your *Home* screen is your daily command center. It gives you a quick snapshot of your progress for the day.


== Daily Summary
At the top of the screen, you will see your *Activity Rings*. These visual indicators show you exactly how many calories you have consumed and how much is remaining to hit your daily target.
- *Outer Ring:* Calories
- *Inner Rings:* Protein, Carbs, and Fat

Below the rings, you will find a list of your recent meals, allowing you to quickly review what you have eaten today. 


#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("homescreen_circle.png", width: 45%)
  ],
  [
    #image("homescreen_mealsquare.png", width: 45%)
  ]
)

= Logging Your Meals
Nutri-AI offers two powerful ways to log your food without typing a single word.

== Using the Camera
To log a meal, you should take a picture of it:

1. Tap the #button[+ (Add)] button in the bottom navigation bar.
2. Select #button[Camera].
3. Point your camera at your food and snap a photo.
4. Our AI will analyze the image and identify the food items and their estimated portion sizes.

#tip[
  You can also upload a photo from your gallery by tapping the #button[Image] icon on the camera screen.
] 


#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("add_button.png", width: 45%)
  ],
  [
    #image("camera_screen.png", width: 45%)
  ]
)

#set par(
  first-line-indent: 0pt,
  spacing: 0.6cm,
)


== Voice Logging & Context

Besides logging a picture of the desired meal, this app allows you to complement the nutritional analysis with a audio recording or a text. These should contain more details about the logged meal (ingredients, recipe details etc.) in order to improve the accuracy of the evaluation. 

If you want to record a description, just press the #button[Microphone] button to start and press the red button to stop. If you want to re-record the audio, just press the #button[Re-Record] button. Press the button #button[Analyze Meal] to proceed with the analysis.

#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("audio_text.png", width: 45%)
  ],
  [
    #image("re_record.png", width: 45%)
  ]
)










//1. Tap the #button[+ (Add)] button.
//2. Select #button[Voice].
//3. Say something like, "I had a grilled chicken salad with half an avocado and a glass of orange juice."

//#info(title: "Adding Context")[
  //Even when using the camera, you can add voice or text notes! For example, if you take a picture of a burger but remove the bun, you can say "I didn't eat the bun" and the AI will adjust the calories accordingly.
//]

== Reviewing Your Meal

After analyzing your meal, you will see a *Review Screen*.

Here, you can see the breakdown of what the AI detected.
- *Nutrition:* in this section you can check the nutritional content of your meal.
- *Analysis:* we also give you a general *Quality Score* that measures how healthy your meal is, as well as a *Goal Fit* score and a *Calorie Density Measure*.

The app automatically generates a *Date*, a *Time* and a *Type* (Breakfast, Lunch, Dinner, Snack, Other) for your meal. If something looks off, you can easily edit the items or quantities before saving. Once you are happy, tap #button[Save] to add it to your daily log.

#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("nutrition_analysis.png", width: 45%)
  ],
  [
    #image("details.png", width: 45%)
  ]
)

// SCREENSHOT: Meal Review Modal showing the detected food items and calories.

//Here, you can see the breakdown of what the AI detected.
//- *Name & Calories:* Verify the food item.
//- *Macros:* Check Protein, Carbs, and Fat.
//- *Quality Score:* See how healthy this meal is.

//If something looks off, you can easily edit the items or quantities before saving. Once you are happy, tap #button[Save] to add it to your daily log.

= Meal Suggestions

#set par(
  first-line-indent: 0pt,
  spacing: 0.6cm,
)

Not sure what to eat today?
Our app can help! The meal suggestions feature looks at what meals you’ve already logged today and their nutritional content, and recommends meals to round out your day.

To get personalized meal ideas, just tap #button[Suggestions for the day]. Only meals you haven’t logged yet will be suggested—for example, if you’ve already added Breakfast, you’ll see suggestions for Lunch and Dinner.

Each suggested meal also comes with a recipe, which you can view by tapping #button[Recipe]. To reverse this step, just press #button[Hide Recipe].



#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("suggestions_button.png", width: 45%)
  ],
  [
    #image("recipe_button.png", width: 45%)
  ]
)

#pagebreak()

= Understanding Your Data
Nutri-AI provides deep insights into your eating habits. Navigate to the #button[Insights] tab to explore.

// SCREENSHOT: Insights Screen showing the bar charts.

== Trends & Charts
The Insights screen provides detailed charts showing your calorie and macronutrient intake over different periods (Day, Week, Month, Year). Use this to spot patterns in your diet. 

#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("barplot_insight.png", width: 45%)
  ],
  [
    #image("highlights.png", width: 45%)
  ]
)


== Highlights

=== Meal Quality Score and Calorie Goal
Nutri-AI doesn't just track *how much* you eat, but *how well* you eat. Tap on the #button[Avg Quality] section to see your *Meal Quality Score*. This score (1-10) rates the nutritional value of your meals based on nutrient density and how well they fit your goals. We also track the number of consecutive days in which you met your calorie goal (didn't under-eat or over-eat). To check that, tap #button[Calorie Goal Met].

#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("meal_quality.png", width: 45%)
  ],
  [
    #image("calorie_goal.png", width: 45%)
  ]
)




=== Current Streak and Max Meal

Consistency is key to building healthy habits. To keep track of how many consecutive days you have logged your meals, you can tap #button[Current Streak]. If you want to check what was the most caloric meal you took in the selected period, you can also check that by tapping the button 
#button[Max Meal].

#warning(title: "Keep it going!")[
  To keep your streak alive, make sure to log your meals every day! Missing a day will reset your counter.
]


//1. *Day Streak:* Consecutive days where you logged your meals.
//2. *Goal Streak:* Consecutive days where you met your calorie goal (didn't under-eat or over-eat).

// SCREENSHOT: Streaks Screen showing the flame icon.


#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("streak.png", width: 45%)
  ],
  [
    #image("laugen.jpeg", width: 45%)
  ]
)


= Calendar & History
Want to look back at what you ate last Tuesday? The #button[Calendar] tab allows you to browse your entire meal history. Simply tap on a date to view your logs for that specific day. This is great for identifying patterns in your eating habits.

#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("calendar_button.png", width: 45%)
  ],
  [
    #image("calendar_screen.jpeg", width: 45%)
  ]
)


= Profile & Settings
The #button[Profile] tab is where you manage your account and preferences.

#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("profile_button.png", width: 45%)
  ],
  [
    #image("profile_screen.png", width: 45%)
  ]
)

If you scroll down, under the menu *Settings* you will find the button #button[Nutrition Goals]. By pressing it, you open a screen where you can alter your *Basic Settings* (Motivation, Activity Level, Current Weight), information regarding your *Weight Goal* (Goal type, Target Weight, Pace) and even customize the daily targets of calories and nutrients under *Advanced*.

#table(
  columns: 2,
  stroke: none,
  inset: 10pt,
  align: center,
  [
    #image("nutrition-button.png", width: 45%)
  ],
  [
    #image("nutrition_settings.PNG", width: 45%)
  ]
)




//- *Update Weight:* Log your weight regularly to track your physical progress.
//- *Edit Goals:* As your fitness journey evolves, your nutritional needs might change. Update your calorie and macro targets here.
//- *Preferences:* Customize app settings to suit your needs.

= Conclusion
Nutri-AI is designed to be simple, smart, and supportive. By logging your meals consistently and reviewing your insights, you are taking a powerful step towards a healthier you.

#success(title: "We are here to help")[
  If you have any questions or need support, please contact our team at support\@nutri-ai.com. Stay healthy!
]

