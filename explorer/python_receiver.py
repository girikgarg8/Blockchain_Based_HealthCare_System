import sys
import json
import base64
import pickle
import warnings
import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
warnings.filterwarnings('ignore')
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import RMSprop
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import Flatten
from tensorflow.keras.layers import Dense, Dropout


def read_txt_file(path):
    """
    This function reads text file and returns a data object.
    """
    with open(path) as f:
        data = f.readlines()
    return data

def get_into_df(data):
    """
    This function reads the data object and converts into a dataframe.
    """
    processed = [[float(val)
                  for val in row.split(' ')
                  if val != '']
                 for row in data]
    return pd.DataFrame(processed)

def hyper_parameter_tuning(model, param_grid, X_train, y_train, scoring = 'f1', cv = 3):
    """
    This function perfroms hyper parameter tuning using grid search cross validation method.
    """
    clf = GridSearchCV(
        model, param_grid, cv=cv,
        scoring=scoring, return_train_score=True, verbose=True, n_jobs=-1
    )
    clf.fit(X_train, y_train)

    print(f"Best cross-validation score : {clf.best_score_ :.2f}")
    print(f"Best parameters             : {clf.best_params_}")

    return clf.best_estimator_

# Read the JSON input from the Node.js server
input_data = sys.stdin.read()

try:
    # Parse the JSON data
    payloadArray = json.loads(input_data)

    lists=[]
    accuracies=[]
    # Process each JSON payload in the array
    for payload in payloadArray:

        encoded_payload_message = payload.get('payloadMessage', '')
        test_Accuracy = payload.get('testAccuracy', '')
        accuracies.append(test_Accuracy)
        print("Received test accuracy: \n", test_Accuracy)
        decoded_string= base64.b64decode(encoded_payload_message)
        weights_list=pickle.loads(decoded_string)
        lists.append(weights_list)
    accuracy_sum=sum(accuracies)

    layers=6
    numModels=len(accuracies)

    for i in range(numModels):
        for j in range(layers):
            lists[i][j]=lists[i][j]*accuracies[i]
    
    for i in range(layers):
        for j in range(1,numModels):
            lists[0][i] = lists[0][i] + lists[j][i]

    for i in range(layers):
        lists[0][i]=lists[0][i]/accuracy_sum 
    
    new_set_of_weights=lists[0]
    
    print("New set of weights are : ",new_set_of_weights)
    
    # loading x train data
    X_train = read_txt_file('X_train.txt')
    X_train = get_into_df(X_train)

    # loading y train data
    y_train = read_txt_file('y_train.txt')
    y_train_ = get_into_df(y_train)
    y_train = y_train_.values.reshape(-1,)

    # loading x test data
    X_test = read_txt_file('X_test.txt')
    X_test = get_into_df(X_test)

    # loading y test data
    y_test = read_txt_file('y_test.txt')
    y_test_ = get_into_df(y_test)
    y_test = y_test_.values.reshape(-1,)

    # get shape
    print("\n \n",X_train.shape, y_train.shape, X_test.shape, y_test.shape)



    from sklearn.preprocessing import OneHotEncoder

    # fit data
    enc = OneHotEncoder()
    enc.fit(y_train.reshape(-1, 1))

    # Transform data into one hot encoder
    y_train__ = enc.transform(y_train_).toarray()
    y_test__  = enc.transform(y_test_).toarray()

    # Create the sequential model
    model = Sequential()
    model.add(Dense(15, activation='relu',
                input_shape=(561,)))
    model.add(Dropout(0.2))
    model.add(Dense(10, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(6, activation='softmax'))

    # Compile the model
    model.compile(loss='categorical_crossentropy', optimizer=RMSprop(), metrics=['accuracy'])
    model.set_weights(new_set_of_weights)


    # prediction on train and test data
    y_train_pred = np.array([np.argmax(row)+1 for row in model.predict(X_train, verbose = 0)])
    y_test_pred = np.array([np.argmax(row)+1 for row in model.predict(X_test, verbose = 0)])

    acc_train = accuracy_score(y_train, y_train_pred)
    acc_test  = accuracy_score(y_test, y_test_pred)

    print(f"Train Data Accuracy Score : {acc_train : .4f}")
    print(f"Test Data Accuracy Score  : {acc_test : .4f}")

except json.JSONDecodeError:
    print("Error: Invalid JSON input from Node.js")

# Flush the output to ensure it's sent immediately
sys.stdout.flush()

