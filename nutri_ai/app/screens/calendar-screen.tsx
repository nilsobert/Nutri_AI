// CalendarScreen.tsx
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MealEntry, MealCategory } from "../../types/mealEntry";
import { getYearMeals } from "../../mock-data/mealstore";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

// MealCard component (from home screen)
const MealCard: React.FC<{
  category: MealCategory;
  meals: MealEntry[];
  isDark: boolean;
}> = ({ category, meals, isDark }) => {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const { width: screenWidth } = useWindowDimensions();

  const toggleExpand = () => {
    setExpanded(!expanded);
    rotation.value = withTiming(expanded ? 0 : 180);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cardBg = isDark
    ? Colors.cardBackground.dark
    : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;

  const totalCalories = meals.reduce(
    (sum, meal) => sum + meal.getNutritionInfo().getCalories(),
    0
  );

  return (
    <Animated.View
      style={[styles.mealCard, { backgroundColor: cardBg }]}
      entering={FadeIn}
      exiting={FadeOut}
    >
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={styles.mealCardHeader}
      >
        <View
          style={[
            styles.mealIcon,
            { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
          ]}
        >
          <Ionicons
            name={
              category === MealCategory.Breakfast
                ? "sunny-outline"
                : category === MealCategory.Lunch
                ? "restaurant-outline"
                : category === MealCategory.Dinner
                ? "moon-outline"
                : "cafe-outline"
            }
            size={24}
            color={Colors.primary}
          />
        </View>

        <View style={styles.mealHeaderInfo}>
          <View style={styles.mealTitleRow}>
            <Text style={[styles.mealName, { color: textColor }]}>{category}</Text>
            <Text
              style={[
                styles.mealCalories,
                { color: textColor, fontWeight: "bold" },
              ]}
            >
              {totalCalories} kcal
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {expanded &&
        meals.map((meal, i) => {
          const nutrition = meal.getNutritionInfo();
          return (
            <View
              style={[
                styles.mealDetails,
                { width: screenWidth - Spacing.xl * 2 },
              ]}
              key={i}
            >
              {/* Removed meal name */}
              <View style={styles.nutrientRow}>
                <View
                  style={[
                    styles.nutrientPill,
                    { backgroundColor: isDark ? "#3498DB20" : "#3498DB15" },
                  ]}
                >
                  <Text style={{ color: "#3498DB" }}>
                    {nutrition.getCarbs()}g Carbs
                  </Text>
                </View>
                <View
                  style={[
                    styles.nutrientPill,
                    { backgroundColor: isDark ? "#34C75920" : "#34C75915" },
                  ]}
                >
                  <Text style={{ color: "#34C759" }}>
                    {nutrition.getProtein()}g Protein
                  </Text>
                </View>
                <View
                  style={[
                    styles.nutrientPill,
                    { backgroundColor: isDark ? "#FF950020" : "#FF950015" },
                  ]}
                >
                  <Text style={{ color: "#FF9500" }}>{nutrition.getFat()}g Fat</Text>
                </View>
              </View>
            </View>
          );
        })}
    </Animated.View>
  );
};

const mealCategories: MealCategory[] = [
  MealCategory.Breakfast,
  MealCategory.Lunch,
  MealCategory.Dinner,
  MealCategory.Snack,
];

export default function CalendarScreen() {
  const today = new Date();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const bgColor = isDark ? Colors.background.dark : Colors.background.light;
  const cardBg = isDark ? Colors.cardBackground.dark : Colors.cardBackground.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const GREEN = Colors.primary;

  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );

  const [yearMeals, setYearMeals] = useState<MealEntry[]>([]);

  useEffect(() => {
    const mealsObj = getYearMeals();
    const mealsArray = Object.values(mealsObj).flatMap((day) =>
      Object.values(day)
    );
    setYearMeals(mealsArray);
  }, []);

  // Filter meals for selected date
  const mealsForSelectedDate: Record<MealCategory, MealEntry[]> = {
    [MealCategory.Breakfast]: [],
    [MealCategory.Lunch]: [],
    [MealCategory.Dinner]: [],
    [MealCategory.Snack]: [],
    [MealCategory.Other]: [],
  };
  yearMeals.forEach((meal) => {
    const mealDate = new Date(meal.getTimestamp() * 1000);
    const dateStr = `${mealDate.getFullYear()}-${String(
      mealDate.getMonth() + 1
    ).padStart(2, "0")}-${String(mealDate.getDate()).padStart(2, "0")}`;
    if (dateStr === selectedDate) {
      mealsForSelectedDate[meal.getCategory()].push(meal);
    }
  });

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const getMonthMatrix = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const firstDayIndexMon = firstDay === 0 ? 6 : firstDay - 1;
    const days = new Date(year, month + 1, 0).getDate();
    const matrix: (number | null)[][] = [];
    let row: (number | null)[] = [];
    for (let i = 0; i < firstDayIndexMon; i++) row.push(null);
    for (let d = 1; d <= days; d++) {
      row.push(d);
      if (row.length === 7) {
        matrix.push(row);
        row = [];
      }
    }
    if (row.length) while (row.length < 7) row.push(null);
    if (row.length) matrix.push(row);
    return matrix;
  };
  const monthMatrix = getMonthMatrix();
  const yearGrid = Array.from({ length: 12 }, (_, i) => i);
  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handleDayPress = (day: number) => {
    const dateObj = new Date(year, month, day);
    const dateStr = `${dateObj.getFullYear()}-${String(
      dateObj.getMonth() + 1
    ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    setSelectedDate(dateStr);
  };

  const prevMonth = () => { if(month===0){ setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){ setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); };
  const prevYear = () => setYear(y=>y-1);
  const nextYear = () => setYear(y=>y+1);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Segmented control */}
      <View style={[styles.segmentWrap, { backgroundColor: isDark ? "#2a2a2a" : "#e8e8e8" }]}>
        {(["month", "year"] as const).map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setViewMode(v)}
            style={[styles.segment, viewMode === v && { backgroundColor: GREEN }]}
          >
            <Text style={[styles.segmentText, { color: viewMode === v ? "white" : GREEN }]}>
              {v.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        {viewMode === "month" && (
          <>
            <TouchableOpacity onPress={prevMonth}>
              <Text style={[styles.arrow, { color: GREEN }]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.centeredHeader}>
              <Text style={[styles.headerTitle, { color: textColor }]}>
                {monthNames[month]} {year}
              </Text>
            </View>
            <TouchableOpacity onPress={nextMonth}>
              <Text style={[styles.arrow, { color: GREEN }]}>›</Text>
            </TouchableOpacity>
          </>
        )}
        {viewMode === "year" && (
          <View style={styles.yearHeader}>
            <TouchableOpacity onPress={prevYear}>
              <Text style={[styles.arrow, { color: GREEN }]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.centeredHeader}>
              <Text style={[styles.headerTitle, { color: textColor }]}>
                {year}
              </Text>
            </View>
            <TouchableOpacity onPress={nextYear}>
              <Text style={[styles.arrow, { color: GREEN }]}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Month view */}
      {viewMode === "month" && (
        <View>
          <View style={styles.weekLabelsRow}>
            {["M","T","W","T","F","S","S"].map((ini,i)=>(
              <Text key={i} style={[styles.weekLabel,{color:"#666"}]}>{ini}</Text>
            ))}
          </View>
          {monthMatrix.map((row,rIdx)=>(
            <View key={rIdx} style={styles.gridRow}>
              {row.map((day,cIdx)=>{
                const isToday = day!==null && isSameDate(new Date(year,month,day), new Date());
                const hasMeal = day!==null && yearMeals.some(meal=>{
                  const mealDate = new Date(meal.getTimestamp()*1000);
                  return mealDate.getFullYear()===year && mealDate.getMonth()===month && mealDate.getDate()===day;
                });
                return (
                  <View key={cIdx} style={styles.gridCell}>
                    {day ? (
                      <TouchableOpacity onPress={()=>handleDayPress(day)} style={[styles.dayCircle,isToday&&{backgroundColor:GREEN,borderRadius:21}]}>
                        <Text style={[styles.dayText,{color:isToday?"white":textColor}]}>{day}</Text>
                        {hasMeal && <View style={{width:6,height:6,borderRadius:3,backgroundColor:"#3498DB",marginTop:4}}/>}
                      </TouchableOpacity>
                    ) : (<View style={styles.dayEmpty}/>)}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* Year view */}
      {viewMode==="year" && (
        <ScrollView contentContainerStyle={styles.yearGrid}>
          {yearGrid.map(m=>(
            <TouchableOpacity key={m} style={[styles.yearCell,{backgroundColor:cardBg},Shadows.small]} onPress={()=>{setMonth(m); setViewMode("month");}}>
              <Text style={[styles.yearMonthText,{color:textColor}]}>{monthNames[m]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={[styles.dateTitle,{color:GREEN}]}>{selectedDate}</Text>

      {/* --- Lower part: Meal Cards --- */}
      <ScrollView style={{ marginHorizontal: -Spacing.xl, paddingHorizontal: Spacing.xl }}>
        {mealCategories.map(category=>{
          const meals = mealsForSelectedDate[category];
          if(meals.length===0) return null;
          return <MealCard key={category} category={category} meals={meals} isDark={isDark}/>;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:Spacing.xl },
  segmentWrap:{ flexDirection:"row", padding:4, borderRadius:BorderRadius.xl, marginBottom:Spacing.lg },
  segment:{ flex:1, paddingVertical:8, borderRadius:BorderRadius.lg, alignItems:"center" },
  segmentText:{ fontWeight:Typography.weights.semibold },
  header:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:Spacing.lg },
  centeredHeader:{ flex:1, alignItems:"center" },
  headerTitle:{ fontSize:Typography.sizes.xl, fontWeight:Typography.weights.semibold },
  arrow:{ fontSize:32, paddingHorizontal:12 },
  weekLabelsRow:{ flexDirection:"row", justifyContent:"space-between", marginBottom:Spacing.sm },
  weekLabel:{ width:`${100/7}%`, textAlign:"center", fontWeight:Typography.weights.semibold },
  gridRow:{ flexDirection:"row", justifyContent:"space-between", marginVertical:6 },
  gridCell:{ width:`${100/7}%`, alignItems:"center" },
  dayCircle:{ width:42, height:42, justifyContent:"center", alignItems:"center" },
  dayText:{ fontSize:Typography.sizes.base },
  dayEmpty:{ width:42, height:42 },
  yearGrid:{ flexDirection:"row", flexWrap:"wrap", justifyContent:"space-between", paddingTop:Spacing.md },
  yearCell:{ width:"48%", paddingVertical:18, borderRadius:BorderRadius.xl, marginBottom:Spacing.lg, alignItems:"center" },
  yearHeader:{ paddingHorizontal:20, paddingTop:10, paddingBottom:6, flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  yearMonthText:{ fontSize:Typography.sizes.lg, fontWeight:Typography.weights.semibold },
  dateTitle:{ fontSize:Typography.sizes.lg, fontWeight:"bold", marginVertical:10 },
  mealCard:{ borderRadius:BorderRadius.xl, padding:Spacing.lg, marginBottom:Spacing.md, ...Shadows.small },
  mealCardHeader:{ flexDirection:"row", alignItems:"center" },
  mealIcon:{ width:48, height:48, borderRadius:24, justifyContent:"center", alignItems:"center", marginRight:Spacing.md },
  mealHeaderInfo:{ flex:1, justifyContent:"center" },
  mealTitleRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  mealName:{ fontSize:Typography.sizes.lg, fontWeight:"600" },
  mealCalories:{ fontSize:Typography.sizes.base },
  mealDetails:{ marginTop:Spacing.sm, paddingHorizontal:0, paddingVertical:Spacing.sm },
  nutrientRow:{ flexDirection:"row", gap:6, marginTop:4 },
  nutrientPill:{ paddingHorizontal:6, paddingVertical:2, borderRadius:8 }
});
