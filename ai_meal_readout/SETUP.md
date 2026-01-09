# Setup Instructions for Benchmark Script

## Using the Virtual Environment

The `ai_meal_readout` directory already has a virtual environment set up. Follow these steps:

### 1. Activate the Virtual Environment

On macOS/Linux:
```bash
cd ai_meal_readout
source venv/bin/activate
```

On Windows:
```bash
cd ai_meal_readout
venv\Scripts\activate
```

### 2. Install Dependencies

Once the virtual environment is activated, install all required packages:

```bash
pip install -r requirements.txt
```

### 3. Verify Installation

You can verify that the packages are installed correctly:

```bash
pip list
```

You should see packages like:
- openai
- python-dotenv
- Pillow
- datasets
- numpy

### 4. Set Up Environment Variables

Make sure you have a `.env` file in the `ai_meal_readout` directory with your API credentials:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=your_base_url_here
```

### 5. Run the Benchmark Script

Once everything is set up, you can run the benchmark:

```bash
python benchmark_food_nutrients.py --subset-size 30 --models Qwen2.5-VL-72B-Instruct
```

### Deactivating the Virtual Environment

When you're done, you can deactivate the virtual environment:

```bash
deactivate
```

## Troubleshooting

If you encounter issues:

1. **Virtual environment not found**: If the venv doesn't exist, create a new one:
   ```bash
   python3 -m venv venv
   ```

2. **Permission errors**: Make sure you have write permissions in the directory

3. **Package installation fails**: Try upgrading pip first:
   ```bash
   pip install --upgrade pip
   ```

4. **Dataset download issues**: The first run will download the dataset from Hugging Face, which may take some time depending on your internet connection.

