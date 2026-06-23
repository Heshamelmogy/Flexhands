export const taskCards = [
  {
    title: "Trim olive tree branches",
    category: "Garden",
    location: "Kreuzberg",
    distance: "2.1 km",
    price: "EUR 72",
    status: "Open",
    urgency: "Today",
    requester: "Mina",
    rating: "4.9"
  },
  {
    title: "Carry sofa to third floor",
    category: "Moving",
    location: "Neukolln",
    distance: "4.8 km",
    price: "EUR 95",
    status: "Offer sent",
    urgency: "Tomorrow",
    requester: "Oskar",
    rating: "4.7"
  },
  {
    title: "Fix loose kitchen cabinet",
    category: "Repairs",
    location: "Prenzlauer Berg",
    distance: "7.5 km",
    price: "EUR 58",
    status: "Verified poster",
    urgency: "Flexible",
    requester: "Lea",
    rating: "5.0"
  }
];

export const messages = [
  { from: "Mina", body: "Can you bring a ladder? The tree is about 3 meters high.", mine: false },
  { from: "You", body: "Yes. I can do EUR 78 including cleanup and disposal.", mine: true },
  { from: "Mina", body: "Deal. I’ll fund escrow now.", mine: false }
];

export const notifications = [
  "New counter-offer on sofa move",
  "Payment held for kitchen cabinet repair",
  "Mina approved your completion photo"
];
