"""
Anomaly Detection Agent - Multi-model approach for detecting unusual spending patterns
Uses Isolation Forest, Statistical Methods, and Autoencoders
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Machine Learning models
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from scipy import stats
import joblib

# Local imports
from config.settings import settings, MODEL_CONFIGS

logger = logging.getLogger(__name__)

class AnomalyDetectionAgent:
    """
    AI agent for detecting anomalies in spending patterns
    """
    
    def __init__(self):
        self.isolation_forest = None
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=0.95)  # Keep 95% of variance
        
        # Anomaly detection thresholds
        self.thresholds = {
            'amount_zscore': 3.0,
            'frequency_zscore': 2.5,
            'isolation_forest': -0.1,
            'statistical_outlier': 0.05  # 5% significance level
        }
    
    async def initialize(self):
        """Initialize the anomaly detection agent"""
        try:
            logger.info("🚀 Initializing Anomaly Detection Agent...")
            
            # Initialize Isolation Forest with config parameters
            config = MODEL_CONFIGS["anomaly_detection"]["isolation_forest"]
            self.isolation_forest = IsolationForest(
                contamination=config["contamination"],
                n_estimators=config["n_estimators"],
                random_state=config["random_state"]
            )
            
            logger.info("✅ Anomaly Detection Agent initialized successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error initializing Anomaly Detection Agent: {str(e)}")
            raise
    
    async def detect_anomalies(
        self,
        transactions: List[Dict[str, Any]],
        historical_data: List[Dict[str, Any]],
        user_id: str
    ) -> Dict[str, Any]:
        """
        Detect anomalies in spending patterns using multiple methods
        """
        try:
            logger.info(f"Detecting anomalies for user: {user_id}")
            
            # Step 1: Prepare data
            current_df = pd.DataFrame(transactions) if transactions else pd.DataFrame()
            historical_df = pd.DataFrame(historical_data) if historical_data else pd.DataFrame()
            
            if current_df.empty:
                return {
                    "user_id": user_id,
                    "anomalies_detected": 0,
                    "anomalies": [],
                    "analysis": {"message": "No current transactions to analyze"},
                    "timestamp": datetime.now().isoformat()
                }
            
            # Step 2: Feature engineering
            features_df = await self._engineer_features(current_df, historical_df)
            
            # Step 3: Multiple anomaly detection methods
            anomaly_results = await self._run_multiple_detection_methods(features_df, historical_df)
            
            # Step 4: Consolidate and rank anomalies
            consolidated_anomalies = await self._consolidate_anomalies(
                anomaly_results, current_df
            )
            
            # Step 5: Generate insights and recommendations
            insights = await self._generate_insights(consolidated_anomalies, current_df, historical_df)
            
            return {
                "user_id": user_id,
                "anomalies_detected": len(consolidated_anomalies),
                "anomalies": consolidated_anomalies,
                "detection_methods": list(anomaly_results.keys()),
                "insights": insights,
                "analysis": await self._generate_analysis_summary(consolidated_anomalies, current_df),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")
            return {
                "user_id": user_id,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _engineer_features(
        self,
        current_df: pd.DataFrame,
        historical_df: pd.DataFrame
    ) -> pd.DataFrame:
        """Engineer features for anomaly detection"""
        
        # Combine current and historical data for feature engineering
        all_data = pd.concat([historical_df, current_df], ignore_index=True) if not historical_df.empty else current_df
        
        # Ensure required columns
        if 'amount' not in all_data.columns:
            all_data['amount'] = 0
        if 'category' not in all_data.columns:
            all_data['category'] = 'Unknown'
        if 'date' not in all_data.columns:
            all_data['date'] = datetime.now()
        
        # Convert data types
        all_data['amount'] = pd.to_numeric(all_data['amount'], errors='coerce').fillna(0)
        all_data['date'] = pd.to_datetime(all_data['date'], errors='coerce')
        
        # Basic features
        features_df = all_data.copy()
        
        # Temporal features
        features_df['hour'] = features_df['date'].dt.hour
        features_df['day_of_week'] = features_df['date'].dt.dayofweek
        features_df['day_of_month'] = features_df['date'].dt.day
        features_df['month'] = features_df['date'].dt.month
        features_df['is_weekend'] = features_df['day_of_week'].isin([5, 6]).astype(int)
        
        # Amount features
        features_df['amount_log'] = np.log1p(features_df['amount'])
        features_df['amount_sqrt'] = np.sqrt(features_df['amount'])
        
        # Category encoding (simple frequency encoding)
        category_counts = features_df['category'].value_counts()
        features_df['category_frequency'] = features_df['category'].map(category_counts)
        
        # Rolling statistics (if enough data)
        if len(features_df) > 7:
            features_df = features_df.sort_values('date')
            features_df['rolling_mean_7d'] = features_df['amount'].rolling(window=7, min_periods=1).mean()
            features_df['rolling_std_7d'] = features_df['amount'].rolling(window=7, min_periods=1).std().fillna(0)
            
            # Deviation from rolling mean
            features_df['deviation_from_mean'] = (
                features_df['amount'] - features_df['rolling_mean_7d']
            ) / (features_df['rolling_std_7d'] + 1e-8)
        else:
            features_df['rolling_mean_7d'] = features_df['amount']
            features_df['rolling_std_7d'] = 0
            features_df['deviation_from_mean'] = 0
        
        return features_df
    
    async def _run_multiple_detection_methods(
        self,
        features_df: pd.DataFrame,
        historical_df: pd.DataFrame
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Run multiple anomaly detection methods"""
        
        anomaly_results = {}
        
        # Method 1: Isolation Forest
        isolation_anomalies = await self._isolation_forest_detection(features_df)
        anomaly_results['isolation_forest'] = isolation_anomalies
        
        # Method 2: Statistical outlier detection
        statistical_anomalies = await self._statistical_outlier_detection(features_df)
        anomaly_results['statistical'] = statistical_anomalies
        
        # Method 3: Z-score based detection
        zscore_anomalies = await self._zscore_detection(features_df)
        anomaly_results['zscore'] = zscore_anomalies
        
        # Method 4: Business rule based detection
        business_anomalies = await self._business_rule_detection(features_df, historical_df)
        anomaly_results['business_rules'] = business_anomalies
        
        return anomaly_results
    
    async def _isolation_forest_detection(self, features_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies using Isolation Forest"""
        
        if len(features_df) < 10:  # Need minimum data points
            return []
        
        try:
            # Select numerical features for Isolation Forest
            numerical_features = [
                'amount', 'amount_log', 'amount_sqrt', 'hour', 'day_of_week',
                'day_of_month', 'month', 'is_weekend', 'category_frequency',
                'rolling_mean_7d', 'rolling_std_7d', 'deviation_from_mean'
            ]
            
            # Filter available features
            available_features = [f for f in numerical_features if f in features_df.columns]
            X = features_df[available_features].fillna(0)
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Fit Isolation Forest
            self.isolation_forest.fit(X_scaled)
            
            # Predict anomalies
            anomaly_scores = self.isolation_forest.decision_function(X_scaled)
            predictions = self.isolation_forest.predict(X_scaled)
            
            # Extract anomalies
            anomalies = []
            for idx, (score, prediction) in enumerate(zip(anomaly_scores, predictions)):
                if prediction == -1:  # Anomaly
                    anomalies.append({
                        'index': idx,
                        'method': 'isolation_forest',
                        'score': float(score),
                        'severity': 'high' if score < -0.2 else 'medium',
                        'features_used': available_features
                    })
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Isolation Forest detection failed: {str(e)}")
            return []
    
    async def _statistical_outlier_detection(self, features_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies using statistical methods"""
        
        anomalies = []
        
        # IQR method for amount
        if 'amount' in features_df.columns and len(features_df) > 4:
            Q1 = features_df['amount'].quantile(0.25)
            Q3 = features_df['amount'].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = features_df[
                (features_df['amount'] < lower_bound) | 
                (features_df['amount'] > upper_bound)
            ]
            
            for idx in outliers.index:
                amount = features_df.loc[idx, 'amount']
                severity = 'high' if amount > Q3 + 3 * IQR or amount < Q1 - 3 * IQR else 'medium'
                
                anomalies.append({
                    'index': idx,
                    'method': 'statistical_iqr',
                    'score': float(abs(amount - features_df['amount'].median())),
                    'severity': severity,
                    'reason': f'Amount ${amount:.2f} is outside normal range'
                })
        
        return anomalies
    
    async def _zscore_detection(self, features_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies using Z-score method"""
        
        anomalies = []
        
        if 'amount' in features_df.columns and len(features_df) > 2:
            # Calculate Z-scores for amount
            mean_amount = features_df['amount'].mean()
            std_amount = features_df['amount'].std()
            
            if std_amount > 0:
                features_df['amount_zscore'] = (features_df['amount'] - mean_amount) / std_amount
                
                # Find outliers (|z-score| > threshold)
                outliers = features_df[abs(features_df['amount_zscore']) > self.thresholds['amount_zscore']]
                
                for idx in outliers.index:
                    zscore = features_df.loc[idx, 'amount_zscore']
                    amount = features_df.loc[idx, 'amount']
                    
                    severity = 'high' if abs(zscore) > 4 else 'medium'
                    
                    anomalies.append({
                        'index': idx,
                        'method': 'zscore',
                        'score': float(abs(zscore)),
                        'severity': severity,
                        'reason': f'Amount ${amount:.2f} has Z-score of {zscore:.2f}'
                    })
        
        return anomalies
    
    async def _business_rule_detection(
        self,
        features_df: pd.DataFrame,
        historical_df: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """Detect anomalies using business rules"""
        
        anomalies = []
        
        # Rule 1: Unusually large transactions
        if 'amount' in features_df.columns and not historical_df.empty:
            historical_amounts = pd.to_numeric(historical_df.get('amount', []), errors='coerce').dropna()
            
            if len(historical_amounts) > 0:
                historical_95th = historical_amounts.quantile(0.95)
                
                large_transactions = features_df[features_df['amount'] > historical_95th * 2]
                
                for idx in large_transactions.index:
                    amount = features_df.loc[idx, 'amount']
                    anomalies.append({
                        'index': idx,
                        'method': 'business_rule_large_amount',
                        'score': float(amount / historical_95th),
                        'severity': 'high',
                        'reason': f'Transaction amount ${amount:.2f} is unusually large'
                    })
        
        # Rule 2: Unusual time patterns
        if 'hour' in features_df.columns:
            # Transactions at unusual hours (very early morning)
            unusual_time = features_df[
                (features_df['hour'] >= 2) & (features_df['hour'] <= 5)
            ]
            
            for idx in unusual_time.index:
                hour = features_df.loc[idx, 'hour']
                anomalies.append({
                    'index': idx,
                    'method': 'business_rule_unusual_time',
                    'score': 1.0,
                    'severity': 'medium',
                    'reason': f'Transaction at unusual hour: {hour}:00'
                })
        
        # Rule 3: Multiple transactions in short time
        if 'date' in features_df.columns and len(features_df) > 1:
            features_df_sorted = features_df.sort_values('date')
            time_diffs = features_df_sorted['date'].diff().dt.total_seconds() / 60  # minutes
            
            rapid_transactions = features_df_sorted[time_diffs < 5]  # Less than 5 minutes apart
            
            for idx in rapid_transactions.index:
                anomalies.append({
                    'index': idx,
                    'method': 'business_rule_rapid_transactions',
                    'score': 1.0,
                    'severity': 'medium',
                    'reason': 'Multiple transactions in short time period'
                })
        
        return anomalies
    
    async def _consolidate_anomalies(
        self,
        anomaly_results: Dict[str, List[Dict[str, Any]]],
        current_df: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """Consolidate anomalies from multiple methods"""
        
        # Collect all anomalies by index
        anomaly_by_index = {}
        
        for method, anomalies in anomaly_results.items():
            for anomaly in anomalies:
                idx = anomaly['index']
                
                if idx not in anomaly_by_index:
                    # Get transaction details
                    if idx < len(current_df):
                        transaction = current_df.iloc[idx].to_dict()
                        anomaly_by_index[idx] = {
                            'transaction_index': idx,
                            'transaction_data': transaction,
                            'detection_methods': [],
                            'scores': [],
                            'reasons': [],
                            'max_severity': 'low'
                        }
                
                if idx in anomaly_by_index:
                    anomaly_by_index[idx]['detection_methods'].append(anomaly['method'])
                    anomaly_by_index[idx]['scores'].append(anomaly['score'])
                    anomaly_by_index[idx]['reasons'].append(anomaly.get('reason', ''))
                    
                    # Update severity
                    current_severity = anomaly_by_index[idx]['max_severity']
                    new_severity = anomaly['severity']
                    
                    severity_order = {'low': 0, 'medium': 1, 'high': 2}
                    if severity_order.get(new_severity, 0) > severity_order.get(current_severity, 0):
                        anomaly_by_index[idx]['max_severity'] = new_severity
        
        # Convert to list and calculate composite scores
        consolidated_anomalies = []
        for idx, anomaly_data in anomaly_by_index.items():
            # Calculate composite score
            scores = anomaly_data['scores']
            composite_score = np.mean(scores) if scores else 0
            
            # Calculate confidence based on number of methods that detected it
            confidence = len(anomaly_data['detection_methods']) / len(anomaly_results)
            
            consolidated_anomalies.append({
                'transaction_index': idx,
                'transaction_data': anomaly_data['transaction_data'],
                'detection_methods': anomaly_data['detection_methods'],
                'composite_score': float(composite_score),
                'confidence': float(confidence),
                'severity': anomaly_data['max_severity'],
                'reasons': list(set(anomaly_data['reasons'])),  # Remove duplicates
                'method_count': len(anomaly_data['detection_methods'])
            })
        
        # Sort by composite score (highest first)
        consolidated_anomalies.sort(key=lambda x: x['composite_score'], reverse=True)
        
        return consolidated_anomalies
    
    async def _generate_insights(
        self,
        anomalies: List[Dict[str, Any]],
        current_df: pd.DataFrame,
        historical_df: pd.DataFrame
    ) -> List[str]:
        """Generate insights from detected anomalies"""
        
        insights = []
        
        if not anomalies:
            insights.append("No significant anomalies detected in your recent transactions.")
            return insights
        
        # High severity anomalies
        high_severity = [a for a in anomalies if a['severity'] == 'high']
        if high_severity:
            insights.append(f"Found {len(high_severity)} high-severity anomalies that require attention.")
        
        # Most common anomaly types
        all_methods = []
        for anomaly in anomalies:
            all_methods.extend(anomaly['detection_methods'])
        
        if all_methods:
            from collections import Counter
            method_counts = Counter(all_methods)
            most_common = method_counts.most_common(1)[0]
            
            method_descriptions = {
                'isolation_forest': 'unusual spending patterns',
                'statistical_iqr': 'amounts outside normal range',
                'zscore': 'statistically unusual amounts',
                'business_rule_large_amount': 'unusually large transactions',
                'business_rule_unusual_time': 'transactions at unusual times',
                'business_rule_rapid_transactions': 'rapid consecutive transactions'
            }
            
            description = method_descriptions.get(most_common[0], 'unusual patterns')
            insights.append(f"Most common anomaly type: {description}")
        
        # Amount-based insights
        anomaly_amounts = [
            a['transaction_data'].get('amount', 0) 
            for a in anomalies 
            if 'amount' in a['transaction_data']
        ]
        
        if anomaly_amounts:
            total_anomaly_amount = sum(anomaly_amounts)
            avg_anomaly_amount = np.mean(anomaly_amounts)
            
            insights.append(f"Total amount in anomalous transactions: ${total_anomaly_amount:.2f}")
            insights.append(f"Average anomalous transaction amount: ${avg_anomaly_amount:.2f}")
        
        # Time-based insights
        anomaly_dates = [
            a['transaction_data'].get('date') 
            for a in anomalies 
            if 'date' in a['transaction_data']
        ]
        
        if anomaly_dates:
            # Convert to datetime if they're strings
            try:
                dates = [pd.to_datetime(d) for d in anomaly_dates if d]
                if dates:
                    date_range = max(dates) - min(dates)
                    insights.append(f"Anomalies span {date_range.days} days")
            except:
                pass
        
        return insights
    
    async def _generate_analysis_summary(
        self,
        anomalies: List[Dict[str, Any]],
        current_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """Generate analysis summary"""
        
        total_transactions = len(current_df)
        anomaly_count = len(anomalies)
        anomaly_rate = (anomaly_count / total_transactions) * 100 if total_transactions > 0 else 0
        
        severity_counts = {}
        for anomaly in anomalies:
            severity = anomaly['severity']
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Risk assessment
        risk_level = "low"
        if anomaly_rate > 20:
            risk_level = "high"
        elif anomaly_rate > 10:
            risk_level = "medium"
        
        return {
            "total_transactions_analyzed": total_transactions,
            "anomalies_detected": anomaly_count,
            "anomaly_rate_percentage": round(anomaly_rate, 2),
            "severity_breakdown": severity_counts,
            "risk_level": risk_level,
            "detection_methods_used": [
                "isolation_forest", "statistical", "zscore", "business_rules"
            ],
            "recommendation": await self._get_recommendation(risk_level, anomaly_count)
        }
    
    async def _get_recommendation(self, risk_level: str, anomaly_count: int) -> str:
        """Get recommendation based on analysis"""
        
        if risk_level == "high":
            return "High anomaly rate detected. Review all flagged transactions and consider updating spending patterns."
        elif risk_level == "medium":
            return "Moderate anomaly rate. Review high-severity anomalies and monitor spending patterns."
        elif anomaly_count > 0:
            return "Few anomalies detected. Review flagged transactions for any unauthorized activity."
        else:
            return "No significant anomalies detected. Your spending patterns appear normal."