import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

class MLModel:
    def __init__(self, model):
        self.model = model

    def train(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)

class RandomForestModel(MLModel):
    def __init__(self):
        super().__init__(RandomForestClassifier())

class XGBoostModel(MLModel):
    def __init__(self):
        super().__init__(XGBClassifier(use_label_encoder=False, eval_metric='logloss'))

class EnsembleModel(MLModel):
    def __init__(self):
        self.models = [RandomForestClassifier(), XGBClassifier(use_label_encoder=False, eval_metric='logloss')]

    def train(self, X, y):
        for model in self.models:
            model.fit(X, y)

    def predict(self, X):
        predictions = np.array([model.predict(X) for model in self.models])
        return np.round(np.mean(predictions, axis=0))