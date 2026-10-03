# EV-Range-Prediction
AI-Based EV Range Prediction and Smart Navigation System that predicts electric vehicle travel distance based on battery level, driving conditions, and vehicle parameters, while also providing intelligent charging station recommendations along the route.

## Dynamic Physics & Battery Drain Model

This application features a highly realistic physics engine that dynamically drains the virtual EV battery based on exact real-world variables, calculating consumption using a sophisticated 'consumption multiplier' that penalizes aggressive driving.

- **Optimal Efficiency (multiplier = 1.0)**: Normal cruising speed. Optimal battery consumption matching exact spec estimates.
- **Good Efficiency (multiplier = 1.5)**: Faster acceleration or moderately un-optimized speeds resulting in increased battery drain.
- **Poor Efficiency (multiplier = 2.5)**: Speeds exceeding 120km/h trigger massive power draw mimicking exponential aero-drag losses. 

The core calculation applied is: `NewBattery = CurrentBattery - (BaseDrain * consumptionMultiplier)`
