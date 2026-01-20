import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CaptureWaitReviewContainer from '../components/AddMeal/CaptureWaitReviewContainer';

const AddMealScreen = () => {
  const { date, meal } = useLocalSearchParams<{ date: string; meal: string }>();
  
  return <CaptureWaitReviewContainer initialDate={date} initialMealJson={meal} />;
};

export default AddMealScreen;
