import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [subject, setSubject] = useState("");
  const [selectedCards, setSelectedCards] = useState({});
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageSize, setImageSize] = useState("512x512");
  const [imageUrl, setImageUrl] = useState("");
  const [cardsData, setCardsData] = useState(null);

  useEffect(() => {
    async function loadCards() {
      try {
        const response = await fetch("http://localhost:5001/api/cards");
        const data = await response.json();
        setCardsData(data);
      } catch (error) {
        alert("Failed to load cards");
      }
    }

    loadCards();
  }, []);

  if (!cardsData) {
    return <p>Loading cards...</p>;
  }

  const cardSteps = [
    {
      key: "style_card",
      title: "Choose a Style",
      cards: Object.entries(cardsData.style_cards).map(([id, card]) => ({
        id,
        label: card.name,
        image: card.image,
        description: card.description
      }))
    },
    {
      key: "emotion_card",
      title: "Choose an Emotion",
      cards: Object.entries(cardsData.emotion_cards).map(([id, card]) => ({
        id,
        label: card.name,
        image: card.image,
        description: card.description
      }))
    },
    {
      key: "texture_card",
      title: "Choose a Texture",
      cards: Object.entries(cardsData.texture_cards).map(([id, card]) => ({
        id,
        label: card.name,
        image: card.image,
        description: card.description
      }))
    },
    {
      key: "special_effect_card",
      title: "Choose a Special Effect",
      cards: Object.entries(cardsData.special_effect_cards).map(([id, card]) => ({
        id,
        label: card.name,
        image: card.image,
        description: card.description
      }))
    }
  ];

  const currentStep = cardSteps[stepIndex];

  async function handleCardClick(cardId) {
    const updatedCards = {
      ...selectedCards,
      [currentStep.key]: cardId
    };

    setSelectedCards(updatedCards);

    if (stepIndex < cardSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      await generatePrompt(updatedCards);
    }
  }

  async function handleSkip() {
    const updatedCards = {
      ...selectedCards,
      [currentStep.key]: null
    };

    setSelectedCards(updatedCards);

    if (stepIndex < cardSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      await generatePrompt(updatedCards);
    }
  }

  async function generatePrompt(cards) {
    if (!subject.trim()) {
      alert("Please enter a subject first.");
      return;
    }

    const [width, height] = imageSize.split("x").map(Number);

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/prompts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subject,
          language: "en",
          width,
          height,
          ...cards
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate prompt");
      }

      setGeneratedPrompt(result.data.prompt);
      setImageUrl(result.data.image_url);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStepIndex(0);
    setSelectedCards({});
    setGeneratedPrompt("");
    setImageUrl("");
  }

  if (generatedPrompt) {
    return (
      <div className="page">
        <div className="container">
          <h1>Generated Prompt</h1>

          <textarea
            className="promptBox"
            value={generatedPrompt}
            readOnly
          />

          {imageUrl && (
            <img
              src={imageUrl}
              alt="Generated"
              className="generatedImage"
            />
          )}

          <button onClick={restart}>Create Another Prompt</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Image Cards to Fine Art</h1>

        <input
          className="subjectInput"
          type="text"
          placeholder="Write your subject here"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <select
          value={imageSize}
          onChange={(e) => setImageSize(e.target.value)}
        >
          <option value="512x512">512 × 512</option>
          <option value="384x384">384 × 384</option>
          <option value="256x256">256 × 256</option>
          <option value="512x768">512 × 768</option>
          <option value="768x512">768 × 512</option>
        </select>

        <h2>{currentStep.title}</h2>

        <div className="cardGrid">
          {currentStep.cards.map((card) => (
            <button
              key={card.id}
              className="imageCard"
              onClick={() => handleCardClick(card.id)}
            >
              <img src={card.image} alt={card.label} />

              <div className="cardOverlay">
                <p>{card.description}</p>
              </div>

              <span className="cardName">{card.label}</span>
            </button>
          ))}
        </div>

        <button className="skipButton" onClick={handleSkip}>
          Skip
        </button>

        {loading && <p>Generating image, please wait...</p>}
      </div>
    </div>
  );
}