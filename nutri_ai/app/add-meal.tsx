import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CaptureWaitReviewContainer from '../components/AddMeal/CaptureWaitReviewContainer';

const AddMealScreen = () => {
  const { date } = useLocalSearchParams<{ date: string }>();
  
  return <CaptureWaitReviewContainer initialDate={date} />;
};

export default AddMealScreen;
