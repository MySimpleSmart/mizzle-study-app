export type SourceType =
  | "youtube"
  | "website"
  | "pdf"
  | "slides"
  | "word"
  | "powerpoint"
  | "notes";

export type QuestionType =
  | "single-choice"
  | "multiple-choice"
  | "fill-blank"
  | "drag-fill"
  | "short-answer"
  | "mixed";

export type Difficulty = "easy" | "medium" | "hard";

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  url?: string;
  addedAt: string;
  description?: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
}

export interface Section {
  id: string;
  /** Topics studied together as one combined learning unit */
  topicIds: string[];
  title: string;
  /** Plain-text preview derived from combined study content for this section */
  excerpt: string;
  generatedAt: string;
  /** Total times this section was reviewed or edited (combined) */
  reviewEditTotal: number;
  /** When true, hidden from the main list (saved in archive) */
  archived?: boolean;
}

/** Stable key for comparing whether two sections cover the same topic set */
export function sectionTopicSetKey(topicIds: string[]): string {
  return [...topicIds].sort().join("|");
}

export function buildCombinedSectionTitle(
  topicIds: string[],
  topics: Topic[]
): string {
  const names = topicIds
    .map((id) => topics.find((t) => t.id === id)?.name)
    .filter(Boolean) as string[];
  if (names.length === 0) return "Study unit";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** Strip markdown / list noise for a readable plain-text excerpt */
function stripStudyMarkdownToPlain(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\$[^$\n]+\$/g, "")
    .replace(/\\\([^)]*\\\)/g, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a short excerpt from the combined study markdown for the given topics
 * (order follows topicIds; content is concatenated in that order).
 */
export function buildSectionExcerpt(
  topicIds: string[],
  studyContent: Record<string, string>,
  maxLength = 120
): string {
  const combined = topicIds
    .map((id) => studyContent[id] ?? "")
    .filter(Boolean)
    .join("\n\n");
  if (!combined.trim()) return "";
  const plain = stripStudyMarkdownToPlain(combined);
  if (plain.length <= maxLength) return plain;
  const cut = plain.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed =
    lastSpace > maxLength * 0.55 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.trimEnd()}…`;
}

export interface QuizQuestion {
  id: string;
  type: Exclude<QuestionType, "mixed">;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  topicId?: string;
}

export interface QuizSettings {
  questionCount: number;
  difficulty: Difficulty;
  questionType: QuestionType;
  selectedTopics: string[];
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

export const sampleSources: Source[] = [
  {
    id: "s1",
    type: "youtube",
    title: "Machine Learning Crash Course – Google",
    url: "https://youtube.com/watch?v=example1",
    addedAt: "2025-04-01",
    description:
      "A comprehensive introduction to ML concepts by Google Engineers.",
  },
  {
    id: "s2",
    type: "pdf",
    title: "Introduction to Statistical Learning (Ch. 1–3)",
    addedAt: "2025-04-02",
    description:
      "First three chapters covering the basics of statistical learning theory.",
  },
  {
    id: "s3",
    type: "website",
    title: "Scikit-learn Documentation – Supervised Learning",
    url: "https://scikit-learn.org/stable/supervised_learning.html",
    addedAt: "2025-04-02",
    description: "Official documentation for scikit-learn supervised models.",
  },
  {
    id: "s4",
    type: "slides",
    title: "CS229 Lecture Slides – Stanford",
    addedAt: "2025-04-03",
    description:
      "Andrew Ng's Stanford CS229 lecture slides on learning algorithms.",
  },
  {
    id: "s5",
    type: "notes",
    title: "My Class Notes – Week 1",
    addedAt: "2025-04-03",
    description:
      "Personal notes from the first week of the machine learning course.",
  },
];

export const sampleTopics: Topic[] = [
  {
    id: "t1",
    name: "Supervised Learning",
    description:
      "Learning from labeled data to predict outcomes for new inputs.",
  },
  {
    id: "t2",
    name: "Unsupervised Learning",
    description:
      "Discovering hidden patterns in data without predefined labels.",
  },
  {
    id: "t3",
    name: "Neural Networks",
    description:
      "Computing systems inspired by biological neural networks in the brain.",
  },
  {
    id: "t4",
    name: "Decision Trees",
    description:
      "Tree-structured models that split data based on feature conditions.",
  },
  {
    id: "t5",
    name: "Model Evaluation",
    description:
      "Techniques for assessing model performance and generalization ability.",
  },
  {
    id: "t6",
    name: "Feature Engineering",
    description:
      "The process of selecting, transforming, and creating input features.",
  },
];

export const sampleStudyContent: Record<string, string> = {
  t1: `## Supervised Learning

Supervised learning is one of the most widely used paradigms in machine learning. The core idea is straightforward: you provide the algorithm with **labeled training data** — input-output pairs — and it learns a mapping function that can predict outputs for new, unseen inputs.

### Key Concepts

- **Training Data** — A dataset of examples where each input is paired with the correct output (label).
- **Features** — The measurable properties of the data used as input to the model.
- **Labels** — The known output values that the model is trying to predict.
- **Hypothesis Function** — The learned function \\( h(x) \\) that maps inputs to predicted outputs.

### Types of Supervised Learning

**Classification** — The output is a discrete category. Examples include spam detection (spam / not spam), image recognition (cat / dog / bird), and medical diagnosis.

**Regression** — The output is a continuous value. Examples include house price prediction, temperature forecasting, and stock price estimation.

### How It Works

1. **Collect** labeled training examples
2. **Choose** a model architecture (e.g., linear regression, decision tree, neural network)
3. **Train** the model by minimizing a loss function
4. **Evaluate** performance on held-out test data
5. **Deploy** the model for real-world predictions

### Common Algorithms

| Algorithm | Type | Best For |
|-----------|------|----------|
| Linear Regression | Regression | Simple continuous predictions |
| Logistic Regression | Classification | Binary classification |
| Random Forest | Both | Structured / tabular data |
| SVM | Both | High-dimensional spaces |
| Neural Networks | Both | Complex patterns, images, text |

### Real-World Applications

- **Email Filtering** — Classifying emails as spam or legitimate
- **Medical Imaging** — Detecting tumors in X-rays and MRIs
- **Voice Assistants** — Converting speech to text
- **Recommendation Systems** — Suggesting products based on past behavior`,

  t2: `## Unsupervised Learning

Unsupervised learning works with **unlabeled data** — the algorithm must discover structure and patterns on its own without any predefined answers.

### Key Concepts

- **Clustering** — Grouping similar data points together (e.g., K-Means, DBSCAN)
- **Dimensionality Reduction** — Reducing the number of features while preserving important information (e.g., PCA, t-SNE)
- **Anomaly Detection** — Identifying unusual data points that don't fit the expected pattern

### Common Algorithms

- **K-Means Clustering** — Partitions data into K groups based on distance to cluster centers
- **Hierarchical Clustering** — Builds a tree of clusters from bottom-up or top-down
- **Principal Component Analysis (PCA)** — Projects data onto axes of maximum variance
- **Autoencoders** — Neural networks that learn compressed representations

### Applications

- Customer segmentation in marketing
- Topic modeling in text analysis
- Image compression
- Fraud detection in financial transactions`,

  t3: `## Neural Networks

Neural networks are computing systems loosely inspired by the biological neural networks in the human brain. They form the foundation of **deep learning**.

### Architecture

A neural network consists of layers of interconnected **neurons** (nodes):

- **Input Layer** — Receives the raw data features
- **Hidden Layers** — Process information through weighted connections and activation functions
- **Output Layer** — Produces the final prediction

### How Neurons Work

Each neuron computes a weighted sum of its inputs, adds a bias term, and passes the result through an **activation function**:

\\[ output = f(\\sum_{i} w_i \\cdot x_i + b) \\]

Common activation functions include ReLU, Sigmoid, and Tanh.

### Training Process

1. **Forward Pass** — Input flows through the network to produce a prediction
2. **Loss Calculation** — Compare prediction against the actual label
3. **Backpropagation** — Calculate gradients of the loss with respect to each weight
4. **Weight Update** — Adjust weights using gradient descent to minimize loss

### Types of Neural Networks

- **Feedforward (MLP)** — Basic architecture for tabular data
- **Convolutional (CNN)** — Specialized for image and spatial data
- **Recurrent (RNN/LSTM)** — Designed for sequential data like text and time series
- **Transformer** — State-of-the-art for NLP tasks, powers GPT and BERT`,

  t4: `## Decision Trees

Decision trees are intuitive, tree-structured models that make predictions by learning a series of **if-then-else** rules from the data.

### Structure

- **Root Node** — The first split, chosen based on the most informative feature
- **Internal Nodes** — Decision points that test a condition on a feature
- **Leaf Nodes** — Terminal nodes that provide the final prediction
- **Branches** — The paths connecting nodes based on feature values

### Splitting Criteria

- **Gini Impurity** — Measures the probability of incorrect classification
- **Information Gain (Entropy)** — Measures the reduction in uncertainty after a split
- **Variance Reduction** — Used for regression trees

### Advantages

- Easy to interpret and visualize
- Handles both numerical and categorical data
- Requires minimal data preprocessing
- Can capture non-linear relationships

### Limitations

- Prone to **overfitting** on noisy data
- Can be unstable — small data changes cause different trees
- Greedy algorithm may not find the globally optimal tree

### Ensemble Methods

- **Random Forest** — Averages predictions from many trees trained on random subsets
- **Gradient Boosting** — Sequentially builds trees to correct previous errors
- **XGBoost** — Optimized gradient boosting with regularization`,

  t5: `## Model Evaluation

Evaluating a model properly is critical to understanding how well it will perform on real-world data.

### Train / Test Split

Always evaluate on data the model has **never seen** during training:

- **Training Set** (70-80%) — Used to fit the model
- **Validation Set** (10-15%) — Used to tune hyperparameters
- **Test Set** (10-15%) — Used for final performance assessment

### Classification Metrics

- **Accuracy** — Proportion of correct predictions (can be misleading for imbalanced data)
- **Precision** — Of all positive predictions, how many are actually positive
- **Recall** — Of all actual positives, how many did we correctly identify
- **F1 Score** — Harmonic mean of precision and recall
- **ROC-AUC** — Area under the receiver operating characteristic curve

### Regression Metrics

- **Mean Absolute Error (MAE)** — Average absolute difference between predicted and actual
- **Mean Squared Error (MSE)** — Average squared difference (penalizes large errors)
- **R² Score** — Proportion of variance explained by the model

### Cross-Validation

K-Fold cross-validation provides a more robust estimate by training and evaluating K times, each time using a different fold as the test set.

### Avoiding Common Pitfalls

- **Overfitting** — Model memorizes training data but fails on new data (high variance)
- **Underfitting** — Model is too simple to capture patterns (high bias)
- **Data Leakage** — Test data information accidentally used during training`,

  t6: `## Feature Engineering

Feature engineering is the process of using domain knowledge to create, select, and transform input features that make machine learning algorithms work better.

### Why It Matters

The quality of features often matters more than the choice of algorithm. Well-engineered features can:
- Improve model accuracy significantly
- Reduce training time
- Make models more interpretable

### Common Techniques

- **One-Hot Encoding** — Converting categorical variables into binary columns
- **Normalization / Standardization** — Scaling numerical features to a common range
- **Polynomial Features** — Creating interaction terms and higher-degree features
- **Binning** — Converting continuous variables into discrete bins
- **Log Transform** — Reducing skewness in right-tailed distributions

### Feature Selection

- **Filter Methods** — Statistical tests (correlation, chi-squared)
- **Wrapper Methods** — Recursive feature elimination
- **Embedded Methods** — Built into the model (L1 regularization, tree-based importance)

### Best Practices

- Start with domain knowledge
- Visualize feature distributions
- Check for multicollinearity
- Automate feature pipelines for reproducibility`,
};

export const sampleSections: Section[] = [
  {
    id: "sec1",
    topicIds: ["t1", "t3"],
    title: "Supervised Learning & Neural Networks",
    excerpt: buildSectionExcerpt(["t1", "t3"], sampleStudyContent),
    generatedAt: "2025-04-03",
    reviewEditTotal: 14,
  },
];

export const sampleQuizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    type: "single-choice",
    question:
      "Which type of learning uses labeled data to train a model?",
    options: [
      "Unsupervised Learning",
      "Supervised Learning",
      "Reinforcement Learning",
      "Self-supervised Learning",
    ],
    correctAnswer: "Supervised Learning",
    explanation:
      "Supervised learning uses labeled training data — pairs of inputs and known outputs — to learn a mapping function.",
  },
  {
    id: "q2",
    type: "multiple-choice",
    question:
      "Which of the following are classification metrics? (Select all that apply)",
    options: ["Precision", "MAE", "F1 Score", "R² Score", "Recall"],
    correctAnswer: ["Precision", "F1 Score", "Recall"],
    explanation:
      "Precision, F1 Score, and Recall are classification metrics. MAE and R² Score are regression metrics.",
  },
  {
    id: "q3",
    type: "fill-blank",
    question:
      'In a neural network, the process of calculating gradients of the loss with respect to each weight is called ______.',
    correctAnswer: "backpropagation",
    explanation:
      "Backpropagation is the algorithm used to calculate gradients efficiently by propagating errors backward through the network.",
  },
  {
    id: "q4",
    type: "single-choice",
    question:
      "What splitting criterion measures the probability of incorrect classification in decision trees?",
    options: [
      "Information Gain",
      "Gini Impurity",
      "Variance Reduction",
      "Chi-squared",
    ],
    correctAnswer: "Gini Impurity",
    explanation:
      "Gini Impurity measures how often a randomly chosen element would be incorrectly classified.",
  },
  {
    id: "q5",
    type: "short-answer",
    question:
      "Explain the difference between overfitting and underfitting in 1–2 sentences.",
    correctAnswer:
      "Overfitting occurs when a model memorizes training data but fails to generalize to new data (high variance). Underfitting occurs when a model is too simple to capture the underlying patterns (high bias).",
    explanation:
      "The bias-variance tradeoff is central to model evaluation — finding the sweet spot between underfitting and overfitting.",
  },
];

export const sampleNotes: Note[] = [
  {
    id: "n1",
    content:
      "Key takeaway: Supervised learning needs labeled data. The quality and quantity of labels directly impacts model performance. Need to review the bias-variance tradeoff section more carefully.",
    createdAt: "2025-04-03T10:30:00",
    topicId: "t1",
  },
  {
    id: "n2",
    content:
      "Random Forest = many decision trees combined. Each tree trains on a random subset of features and data. This reduces overfitting compared to a single tree. Remember: bagging vs boosting distinction.",
    createdAt: "2025-04-03T11:15:00",
    topicId: "t4",
  },
  {
    id: "n3",
    content:
      "For the exam: make sure to know the difference between precision and recall. Precision = TP / (TP + FP). Recall = TP / (TP + FN). F1 balances both.",
    createdAt: "2025-04-03T14:00:00",
    topicId: "t5",
  },
];

export const aiBrief = {
  overview:
    "This study session covers the foundations of machine learning, drawn from a Google crash course video, Stanford CS229 slides, the ISLR textbook, scikit-learn documentation, and your own class notes. The material spans six core topics — from supervised and unsupervised learning paradigms to practical concerns like feature engineering and model evaluation.",
  keyInsights: [
    "Supervised learning requires labeled data and is the most common ML paradigm",
    "Neural networks are the foundation of deep learning and power modern AI",
    "Model evaluation goes beyond accuracy — consider precision, recall, and F1",
    "Feature engineering often has more impact on results than algorithm choice",
    "Decision trees are interpretable but prone to overfitting without ensembles",
  ],
  sourceCount: 5,
  topicCount: 6,
  estimatedStudyTime: "2–3 hours",
};

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topicId: string;
}

export const sampleFlashcards: Flashcard[] = [
  {
    id: "f1",
    front: "What is supervised learning?",
    back: "A machine learning paradigm where the model learns from labeled training data — input-output pairs — to predict outcomes for new, unseen inputs.",
    topicId: "t1",
  },
  {
    id: "f2",
    front: "What is the difference between classification and regression?",
    back: "Classification predicts discrete categories (e.g., spam/not spam), while regression predicts continuous values (e.g., house prices).",
    topicId: "t1",
  },
  {
    id: "f3",
    front: "What are the three main types of unsupervised learning?",
    back: "1. Clustering — grouping similar data points\n2. Dimensionality reduction — reducing features while preserving information\n3. Anomaly detection — identifying unusual data points",
    topicId: "t2",
  },
  {
    id: "f4",
    front: "What is backpropagation?",
    back: "An algorithm that calculates gradients of the loss function with respect to each weight by propagating errors backward through the network, enabling weight updates via gradient descent.",
    topicId: "t3",
  },
  {
    id: "f5",
    front: "Name four types of neural networks and their primary use cases.",
    back: "1. Feedforward (MLP) — tabular data\n2. CNN — images and spatial data\n3. RNN/LSTM — sequential data (text, time series)\n4. Transformer — NLP tasks (powers GPT, BERT)",
    topicId: "t3",
  },
  {
    id: "f6",
    front: "What is Gini Impurity?",
    back: "A splitting criterion in decision trees that measures the probability of incorrectly classifying a randomly chosen element from the dataset.",
    topicId: "t4",
  },
  {
    id: "f7",
    front: "What is the difference between overfitting and underfitting?",
    back: "Overfitting: model memorizes training data but fails on new data (high variance).\nUnderfitting: model is too simple to capture patterns (high bias).",
    topicId: "t5",
  },
  {
    id: "f8",
    front: "What is the F1 Score?",
    back: "The harmonic mean of precision and recall. It balances both metrics and is especially useful for imbalanced datasets where accuracy alone can be misleading.",
    topicId: "t5",
  },
];
