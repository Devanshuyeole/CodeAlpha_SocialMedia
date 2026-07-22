const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

router.get('/:username', auth, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const posts = await Post.find({ user: user.id }).sort({ date: -1 });
        res.json({ user, posts });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/follow/:id', auth, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);
        if (!userToFollow) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (currentUser.following.some(follow => follow.toString() === userToFollow.id)) {
            currentUser.following = currentUser.following.filter(follow => follow.toString() !== userToFollow.id);
            userToFollow.followers = userToFollow.followers.filter(follower => follower.toString() !== currentUser.id);
        } else {
            currentUser.following.unshift(userToFollow.id);
            userToFollow.followers.unshift(currentUser.id);
        }
        await currentUser.save();
        await userToFollow.save();
        res.json({ following: currentUser.following });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/search/:query', auth, async (req, res) => {
    try {
        const query = req.params.query;
        if (!query) {
            return res.json([]);
        }
        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        }).select('username').limit(10);
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});
router.put('/profile', auth, async (req, res) => {
    try {
        const { bio } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { bio },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;