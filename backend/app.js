import fs from "node:fs/promises";
import path from "node:path";
import bodyParser from "body-parser";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const eventsPath = path.join(process.cwd(), "data", "events.json");
const imagesPath = path.join(process.cwd(), "data", "images.json");

app.get("/events", async (req, res) => {
  const { max, search } = req.query;
  try {
    const eventsFileContent = await fs.readFile(eventsPath, "utf-8");
    let events = JSON.parse(eventsFileContent);

    if (search) {
      events = events.filter((event) => {
        const searchableText = `${event.title} ${event.description} ${event.location}`;
        return searchableText.toLowerCase().includes(search.toLowerCase());
      });
    }

    if (max) {
      events = events.slice(events.length - max, events.length);
    }

    res.json({
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        image: event.image,
        date: event.date,
        location: event.location,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to read events data" });
  }
});

app.get("/events/images", async (req, res) => {
  try {
    const imagesFileContent = await fs.readFile(imagesPath, "utf-8");
    const images = JSON.parse(imagesFileContent);
    res.json({ images });
  } catch (err) {
    res.status(500).json({ message: "Failed to read images data" });
  }
});

app.get("/events/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const eventsFileContent = await fs.readFile(eventsPath, "utf-8");
    const events = JSON.parse(eventsFileContent);
    const event = events.find((event) => event.id === id);

    if (!event) {
      return res.status(404).json({ message: `No event found for id ${id}` });
    }

    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: "Failed to load event details" });
  }
});

app.post("/events", async (req, res) => {
  const { event } = req.body;
  if (!event) return res.status(400).json({ message: "Event required" });

  try {
    const eventsFileContent = await fs.readFile(eventsPath, "utf-8");
    const events = JSON.parse(eventsFileContent);
    const newEvent = {
      id: Math.round(Math.random() * 10000).toString(),
      ...event,
    };
    events.push(newEvent);

    await fs.writeFile(eventsPath, JSON.stringify(events));
    res.json({ event: newEvent });
  } catch (err) {
    res.status(500).json({ message: "Failed to save event" });
  }
});

app.put("/events/:id", async (req, res) => {
  const { id } = req.params;
  const { event } = req.body;
  try {
    const eventsFileContent = await fs.readFile(eventsPath, "utf-8");
    const events = JSON.parse(eventsFileContent);
    const eventIndex = events.findIndex((e) => e.id === id);

    if (eventIndex === -1)
      return res.status(404).json({ message: "Event not found" });

    events[eventIndex] = { id, ...event };
    await fs.writeFile(eventsPath, JSON.stringify(events));
    res.json({ event: events[eventIndex] });
  } catch (err) {
    res.status(500).json({ message: "Failed to update event" });
  }
});

app.delete("/events/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const eventsFileContent = await fs.readFile(eventsPath, "utf-8");
    const events = JSON.parse(eventsFileContent);
    const eventIndex = events.findIndex((e) => e.id === id);

    if (eventIndex === -1)
      return res.status(404).json({ message: "Event not found" });

    events.splice(eventIndex, 1);
    await fs.writeFile(eventsPath, JSON.stringify(events));
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete event" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
