import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

def load_and_clean_data(filepath):
    # Read the file, skipping the first row if it's purely empty commas
    # Based on the cat output, the first line is ",,,,,,,,,"
    # We can skip the first row.
    try:
        df = pd.read_csv(filepath, skiprows=1)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return None

    # Columns of interest
    # App,Meal,Ground_Truth_Calories,Estimation_Calories,Ground_Truth_Carbs,Estimation_Carbs,Ground_Truth_Proteins,Estimation_Proteins,Ground_Truth_Fats,Estimation_Fats
    
    # Clean numeric columns
    # Some have commas instead of dots, and might be strings
    numeric_cols = [
        'Ground_Truth_Calories', 'Estimation_Calories',
        'Ground_Truth_Carbs', 'Estimation_Carbs',
        'Ground_Truth_Proteins', 'Estimation_Proteins',
        'Ground_Truth_Fats', 'Estimation_Fats'
    ]

    # Convert all numeric columns, handling both object and numeric types with commas
    for col in numeric_cols:
        try:
            # Convert to string first to handle commas, then to float
            df[col] = df[col].astype(str).str.replace(',', '.').astype(float)
        except Exception as e:
            print(f"Warning: Error converting column {col}: {e}")
    
    # Validate data: check for missing values
    missing_counts = df[numeric_cols].isnull().sum()
    if missing_counts.any():
        print("\nWarning: Missing values detected:")
        print(missing_counts[missing_counts > 0])
    
    # Validate data: check for negative values
    for col in numeric_cols:
        negative_count = (df[col] < 0).sum()
        if negative_count > 0:
            print(f"\nWarning: {negative_count} negative values found in {col}")
    
    return df

def calculate_metrics(df):
    """
    Calculate Percentage Error (PE) for each metric.
    Formula: PE = (Estimation - Ground_Truth) / Ground_Truth
    Note: This is a signed percentage error (can be positive or negative).
    Positive values indicate overestimation, negative values indicate underestimation.
    """
    metrics = ['Calories', 'Carbs', 'Proteins', 'Fats']

    for metric in metrics:
        gt_col = f'Ground_Truth_{metric}'
        est_col = f'Estimation_{metric}'
        
        # Protect against division by zero
        # Replace zero ground truth values with a small epsilon to avoid inf/nan
        gt_values = df[gt_col].replace(0, np.nan)
        
        # Calculate percentage error with division by zero protection
        df[f'PE_{metric}'] = (df[est_col] - df[gt_col]) / gt_values
        
        # Check for any inf or nan values created
        inf_count = np.isinf(df[f'PE_{metric}']).sum()
        nan_count = df[f'PE_{metric}'].isna().sum()
        if inf_count > 0 or nan_count > 0:
            print(f"\nWarning: PE_{metric} has {inf_count} infinite and {nan_count} NaN values (likely due to zero ground truth)")

    return df


def build_summary_table(df):
    """
    Build summary table showing Mean Percentage Error (MPE) by app.
    MPE is the signed percentage error: (Estimation - Ground_Truth) / Ground_Truth
    Positive values = overestimation, Negative values = underestimation
    """
    metrics = ['Calories', 'Carbs', 'Proteins', 'Fats']
    pe_cols = [f'PE_{metric}' for metric in metrics]

    summary = df.groupby('App')[pe_cols].mean().sort_index()
    summary = summary * 100
    summary = summary.round(2)
    summary.columns = [f'{col.replace("PE_", "")} MPE (%)' for col in summary.columns]
    return summary


def build_overall_accuracy(df):
    metrics = ['Calories', 'Carbs', 'Proteins', 'Fats']
    pe_cols = [f'PE_{metric}' for metric in metrics]

    mae_summary = df.groupby('App')[pe_cols].apply(lambda frame: frame.abs().mean())
    mae_summary = mae_summary * 100
    mae_summary = mae_summary.round(2)
    mae_summary['Overall_MAE (%)'] = mae_summary.mean(axis=1).round(2)
    mae_summary = mae_summary.sort_values('Overall_MAE (%)')
    mae_summary = mae_summary.rename(columns={
        col: f'{col.replace("PE_", "")} MAE (%)' for col in pe_cols
    })
    return mae_summary


def plot_summary_table(summary, output_path='mean_percentage_error_table.png'):
    fig, ax = plt.subplots(figsize=(10, 2 + 0.4 * len(summary)))
    ax.axis('off')
    table = ax.table(
        cellText=summary.values,
        rowLabels=summary.index,
        colLabels=summary.columns,
        cellLoc='center',
        rowLoc='center',
        loc='center'
    )
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1, 1.4)
    ax.set_title('Mean Percentage Error (MPE) by App and Nutrient\nFormula: (Estimation - Ground Truth) / Ground Truth', pad=20)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close(fig)


def plot_app_boxplots(df, output_path='percentage_error_boxplots.png'):
    metrics = ['Calories', 'Carbs', 'Proteins', 'Fats']
    pe_cols = [f'PE_{metric}' for metric in metrics]

    long_df = df.melt(
        id_vars=['App'],
        value_vars=pe_cols,
        var_name='Metric',
        value_name='Percentage_Error'
    )
    long_df['Metric'] = long_df['Metric'].str.replace('PE_', '')
    long_df['Percentage_Error'] = long_df['Percentage_Error'] * 100

    plt.figure(figsize=(12, 6))
    sns.boxplot(
        data=long_df,
        x='App',
        y='Percentage_Error',
        hue='Metric'
    )
    plt.axhline(0, color='gray', linestyle='--', linewidth=1)
    plt.title('Percentage Error Distribution by App (All Nutrients + Calories)')
    plt.xlabel('App')
    plt.ylabel('Percentage Error (%)')
    plt.xticks(rotation=20, ha='right')
    plt.legend(title='Metric', bbox_to_anchor=(1.02, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()


def plot_overall_accuracy_bar(mae_summary, output_path='overall_accuracy_bar.png'):
    plt.figure(figsize=(10, 5))
    sns.barplot(
        x=mae_summary.index,
        y=mae_summary['Overall_MAE (%)'],
        hue=mae_summary.index,
        palette='viridis',
        legend=False
    )
    plt.title('Overall Mean Absolute Percentage Error by App')
    plt.xlabel('App')
    plt.ylabel('Overall MAE (%)')
    plt.xticks(rotation=20, ha='right')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()


def export_boxplot_data(df, output_path):
    """
    Export percentage error (in %) for each app + metric + meal.
    Output columns: App, Meal, Metric, PE
    """
    metrics = ['Calories', 'Carbs', 'Proteins', 'Fats']
    pe_cols = [f'PE_{metric}' for metric in metrics]

    long_df = df.melt(
        id_vars=['App', 'Meal'],
        value_vars=pe_cols,
        var_name='Metric',
        value_name='PE'
    )

    long_df['Metric'] = long_df['Metric'].str.replace('PE_', '')
    long_df['PE'] = long_df['PE'] * 100
    long_df = long_df.dropna(subset=['PE'])

    long_df.to_csv(output_path, index=False)


def export_overall_mae_bar(mae_summary, output_path):
    """
    Export overall MAE per app for the bar chart.
    Output columns: App, Overall_MAE
    """
    out_df = mae_summary[['Overall_MAE (%)']].copy()
    out_df = out_df.rename(columns={'Overall_MAE (%)': 'Overall_MAE'})
    out_df.reset_index().to_csv(output_path, index=False)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'Meal_Data_Analysis.csv')
    out_boxplot_path = os.path.join(base_dir, 'boxplot_pe.csv')
    out_overall_mae_path = os.path.join(base_dir, 'overall_mae_bar.csv')

    df = load_and_clean_data(csv_path)
    if df is not None:
        print("Data Loaded Successfully")
        print(df.head())
        print(df.dtypes)
        
        df_processed = calculate_metrics(df)
        summary = build_summary_table(df_processed)
        mae_summary = build_overall_accuracy(df_processed)
        print("\nMean Percentage Error by App and Metric:")
        print(summary)
        print("\nMean Absolute Percentage Error and Overall Accuracy:")
        print(mae_summary)
        export_boxplot_data(df_processed, out_boxplot_path)
        export_overall_mae_bar(mae_summary, out_overall_mae_path)
        plot_summary_table(summary, output_path=os.path.join(base_dir, 'mean_percentage_error_table.png'))
        plot_app_boxplots(df_processed, output_path=os.path.join(base_dir, 'percentage_error_boxplots.png'))
        plot_overall_accuracy_bar(mae_summary, output_path=os.path.join(base_dir, 'overall_accuracy_bar.png'))
