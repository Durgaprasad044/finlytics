# AI Finance Assistant - Technical Explanation

This document provides a detailed explanation of the agents used in the AI Finance Assistant, the algorithms they employ, and the behind-the-scenes processes that drive their functionality.

## Agents

### 1. Anomaly Detection Agent
*   *Purpose:* Identifies unusual spending patterns or transactions that deviate from the user's typical financial behavior.
*   *Algorithms:*
    *   *Isolation Forest:* An unsupervised learning algorithm that isolates anomalies by identifying data points that are easily separable from the rest of the data.  The sklearn.ensemble.IsolationForest implementation is used with a contamination parameter of 0.05 and 100 estimators.
    *   *Z-Score Analysis:* Calculates the Z-score for each transaction to determine how many standard deviations it is away from the mean. Transactions with high Z-scores (typically > 3) are flagged as potential anomalies.
*   *Process:*
    1.  The agent receives transaction data from the database, specifically the personal_transactions table.
    2.  The data is preprocessed to remove irrelevant information and prepare it for analysis. This includes converting categorical features to numerical representations using one-hot encoding.
    3.  The Isolation Forest algorithm and Z-score analysis are applied to the data.
    4.  Transactions identified as anomalies are flagged and reported to the user through the notification system.

### 2. Budget Planner Agent
*   *Purpose:* Helps users create and manage budgets based on their income, expenses, and financial goals.
*   *Algorithms:*
    *   *Rule-Based System:* Uses predefined rules and heuristics to allocate income to different budget categories (e.g., housing, food, transportation).  The rules are defined in the config/settings.py file.
    *   *Optimization Algorithm:* Optimizes the budget allocation to maximize savings and achieve financial goals. A simple linear programming approach is used, implemented with the scipy.optimize.linprog function.
*   *Process:*
    1.  The agent gathers information about the user's income, expenses, and financial goals from the ProfileContext.
    2.  The rule-based system generates an initial budget allocation based on the settings.
    3.  The optimization algorithm refines the budget allocation to meet the user's specific needs and goals, considering constraints such as minimum spending in essential categories.
    4.  The agent presents the budget to the user and allows them to make adjustments through the UI.

### 3. Expense Query Agent
*   *Purpose:* Allows users to query their expenses and gain insights into their spending habits.
*   *Algorithms:*
    *   *Natural Language Processing (NLP):* Uses NLP techniques to understand user queries and extract relevant information. The spacy library is used for NLP tasks, with the en_core_web_sm model.
    *   *SQL Query Generation:* Translates user queries into SQL queries to retrieve data from the database.  The langchain library is used to generate SQL queries.
*   *Process:*
    1.  The agent receives a user query in natural language from the Chat component.
    2.  The NLP engine parses the query and extracts relevant information (e.g., time period, category, amount) using spacy.
    3.  The SQL query generator translates the query into an SQL query using langchain and the database schema.
    4.  The query is executed against the database (finance_assistant.db), and the results are returned to the user.

### 4. Goals Agent
*   *Purpose:* Helps users set and track financial goals, such as saving for a down payment on a house or paying off debt.
*   *Algorithms:*
    *   *Progress Tracking:* Monitors the user's progress towards their goals and provides updates on their status.  Progress is tracked by comparing current savings to the goal amount.
    *   *Recommendation Engine:* Recommends strategies and actions to help users achieve their goals.  Recommendations are based on simple heuristics, such as suggesting to reduce spending in certain categories.
*   *Process:*
    1.  The agent gathers information about the user's financial goals from the Goals page.
    2.  The progress tracking module monitors the user's progress towards their goals by querying the database for savings and comparing it to the goal amount.
    3.  The recommendation engine provides personalized recommendations to help the user achieve their goals, displayed in the Chat component.

### 5. Receipt Parsing Agent
*   *Purpose:* Extracts information from receipts, such as the date, vendor, and amount.
*   *Algorithms:*
    *   *Optical Character Recognition (OCR):* Uses OCR to convert the image of the receipt into text. The Tesseract OCR engine is used.
    *   *Regular Expressions:* Uses regular expressions to extract relevant information from the text.  Regular expressions are defined in the config/settings.py file.
*   *Process:*
    1.  The agent receives an image of a receipt from the Receipts page.
    2.  The OCR engine converts the image into text using Tesseract.
    3.  The regular expressions extract relevant information from the text, such as the date, vendor, and amount.
    4.  The extracted information is stored in the database in the receipts table.

### 6. Spending Coach Agent
*   *Purpose:* Provides personalized advice and recommendations to help users improve their spending habits.
*   *Algorithms:*
    *   *Behavioral Analysis:* Analyzes the user's spending patterns to identify areas where they can save money.  Spending patterns are analyzed by grouping transactions by category and calculating spending trends.
    *   *Personalized Recommendations:* Provides personalized recommendations based on the user's spending habits and financial goals. Recommendations are displayed in the Chat component.
*   *Process:*
    1.  The agent analyzes the user's spending patterns by querying the database for transaction data.
    2.  The behavioral analysis module identifies areas where the user can save money, such as by reducing spending on non-essential items.
    3.  The personalized recommendations module provides personalized recommendations to help the user improve their spending habits, displayed in the Chat component.

## Behind-the-Scenes Processes

*   *Data Collection:* Transaction data is collected from various sources, such as bank accounts, credit cards, and receipts.  Bank account and credit card data is simulated using the datasets/personal_transactions.csv file.
*   *Data Preprocessing:* The data is preprocessed to remove irrelevant information and prepare it for analysis. This includes cleaning the data, converting data types, and handling missing values.
*   *Database Storage:* The data is stored in a database (finance_assistant.db) for easy access and retrieval.  The database is a SQLite database.
*   *Realtime Sync:* The data is synced in realtime to ensure that the user always has the most up-to-date information.  Realtime synchronization is implemented using Flask-SocketIO.