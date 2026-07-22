const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Messages');
const User = require('../models/User');

router.post('/:username', auth, async (req, res) => {
    try {
        const recipient = await User.findOne({ username: req.params.username });
        if (!recipient) {
            return res.status(404).json({ msg: 'Recipient not found' });
        }

        const senderId = req.user.id;
        const recipientId = recipient._id;
        const { text } = req.body;

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipientId]
            });
            await conversation.save();
        }

        if (text && text.trim() !== '') {
            const newMessage = new Message({
                conversationId: conversation._id,
                sender: senderId,
                text: text
            });
            conversation.lastMessage = text;
            await Promise.all([conversation.save(), newMessage.save()]);
            return res.json(newMessage);
        }

        res.json({ msg: 'Conversation created or already exists.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user.id })
            .populate('participants', 'username')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/:conversationId', auth, async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .populate('sender', 'username')
            .sort({ createdAt: 1 });
            
        res.json(messages);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;