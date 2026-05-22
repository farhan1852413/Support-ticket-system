const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const messageEmitter = require("../utils/messageEvents");
const ticketRepository = require("../repositories/ticket.repository");

router.get("/stream/:id", async (req, res) => {
  const ticketId = req.params.id;
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const user = decoded;

  const ticket = await ticketRepository.getTicketById(ticketId);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (user.role === "user" && ticket.created_by !== user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (user.role === "agent" && ticket.assigned_to !== user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  const sendMessage = (data) => {
    if (String(data.ticketId) === String(ticketId)) {
      res.write(`data: ${JSON.stringify(data.message)}\n\n`);
    }
  };

  messageEmitter.on("newMessage", sendMessage);

  req.on("close", () => {
    messageEmitter.removeListener("newMessage", sendMessage);
    res.end();
  });
});

module.exports = router;