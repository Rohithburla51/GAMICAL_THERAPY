// Global variables
let pose;
let camera;
let currentExercise = 'wrist';
let score = 0;
let reps = 0;
let streak = 0;
let bestScore = 0;
let level = 1;
let isExercising = false;
let holdTimer = 0;
let perfectHoldTimer = 0;
let lastPoseTime = 0;
let currentCharacter = 'spiderman';
let canScorePoint = true; // New variable to track if we can score a point
const CONFETTI_STREAK_TARGET = 5;

// Character definitions with body part colors and styling
const characters = {
    spiderman: {
        name: "Spider-Man",
        head: { color: '#c41e3a', pattern: 'web' },
        body: { color: '#c41e3a', pattern: 'web' },
        arms: { color: '#0066cc', pattern: 'web' },
        legs: { color: '#0066cc', pattern: 'web' },
        accent: '#000000'
    },
    bheem: {
        name: "Chotta Bheem",
        head: { color: '#ffcc99', pattern: 'solid' },
        body: { color: '#ff9933', pattern: 'solid' },
        arms: { color: '#ffcc99', pattern: 'solid' },
        legs: { color: '#cc6600', pattern: 'solid' },
        accent: '#ffcc00'
    },
    doraemon: {
        name: "Doraemon",
        head: { color: '#4da6ff', pattern: 'solid' },
        body: { color: '#4da6ff', pattern: 'solid' },
        arms: { color: '#4da6ff', pattern: 'solid' },
        legs: { color: '#4da6ff', pattern: 'solid' },
        accent: '#ffffff',
        belly: '#ffffff'
    },
    superhero: {
        name: "Super Kid",
        head: { color: '#ffcc99', pattern: 'solid' },
        body: { color: '#ff0000', pattern: 'solid' },
        arms: { color: '#ffcc99', pattern: 'solid' },
        legs: { color: '#0033cc', pattern: 'solid' },
        accent: '#ffcc00',
        cape: true
    },
    none: {
        name: "No Character",
        head: { color: '#ffccaa', pattern: 'solid' },
        body: { color: '#00aaff', pattern: 'solid' },
        arms: { color: '#ffccaa', pattern: 'solid' },
        legs: { color: '#0088cc', pattern: 'solid' },
        accent: '#ffffff'
    }
};

// Motivational messages
const motivationalMessages = [
    "🔥 You're crushing it!",
    "💪 Amazing form!",
    "⭐ Keep it up champion!",
    "🎯 Perfect execution!",
    "🚀 You're on fire!",
    "✨ Excellent work!",
    "🏆 Outstanding!",
    "💯 Flawless technique!",
    "🌟 Superb effort!",
    "👍 Brilliant performance!"
];

// Exercise definitions
const exercises = {
    wrist: {
        name: "Elbow to Shoulder Touch (Single or Both)",
        description: "Bring your elbow close to your shoulder.",
        checkPose: (landmarks) => {
            const leftElbow = landmarks[13];
            const rightElbow = landmarks[14];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            const leftWrist = landmarks[15];
            const rightWrist = landmarks[16];

            if (!leftElbow || !rightElbow || !leftShoulder || !rightShoulder || !leftWrist || !rightWrist ||
                leftElbow.visibility < 0.5 || rightElbow.visibility < 0.5 ||
                leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 ||
                leftWrist.visibility < 0.5 || rightWrist.visibility < 0.5) {
                return 0;
            }

            let totalAccuracy = 0;
            let leftArmScore = 0;
            let rightArmScore = 0;

            const getElbowAngle = (shoulder, elbow, wrist) => {
                const angleRad = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) -
                                 Math.atan2(shoulder.y - elbow.y, shoulder.x - elbow.x);
                let angleDeg = Math.abs(angleRad * 180 / Math.PI);
                if (angleDeg > 180) angleDeg = 360 - angleDeg;
                return angleDeg;
            };

            // Evaluate Left Arm
            const leftElbowAngle = getElbowAngle(leftShoulder, leftElbow, leftWrist);
            const isLeftElbowBent = leftElbowAngle < 140 && leftElbowAngle > 40;
            const isLeftElbowRaised = leftElbow.y < leftShoulder.y + 0.15;

            if (isLeftElbowBent && isLeftElbowRaised) {
                const distanceY = Math.abs(leftElbow.y - leftShoulder.y);
                const distanceX = Math.abs(leftElbow.x - leftShoulder.x);
                const maxRelevantDistance = 0.2;
                const closeness = Math.max(0, maxRelevantDistance - (distanceY + distanceX) / 2) / maxRelevantDistance;
                leftArmScore = 50 * closeness;
                leftArmScore = Math.min(leftArmScore, 50);
            }

            // Evaluate Right Arm
            const rightElbowAngle = getElbowAngle(rightShoulder, rightElbow, rightWrist);
            const isRightElbowBent = rightElbowAngle < 140 && rightElbowAngle > 40;
            const isRightElbowRaised = rightElbow.y < rightShoulder.y + 0.15;

            if (isRightElbowBent && isRightElbowRaised) {
                const distanceY = Math.abs(rightElbow.y - rightShoulder.y);
                const distanceX = Math.abs(rightElbow.x - rightShoulder.x);
                const maxRelevantDistance = 0.2;
                const closeness = Math.max(0, maxRelevantDistance - (distanceY + distanceX) / 2) / maxRelevantDistance;
                rightArmScore = 50 * closeness;
                rightArmScore = Math.min(rightArmScore, 50);
            }

            totalAccuracy = Math.min(leftArmScore + rightArmScore, 100);
            return totalAccuracy;
        }
    },

    ankle: {
        name: "Seated Leg Raise",
        description: "Sitting upright, extend one knee/leg until it is nearly straight. Only one leg counts at a time.",
        checkPose: (landmarks) => {
            const leftHip = landmarks[23];
            const rightHip = landmarks[24];
            const leftKnee = landmarks[25];
            const rightKnee = landmarks[26];
            const leftAnkle = landmarks[27];
            const rightAnkle = landmarks[28];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];

            if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder) return 0;

            // Check if sitting: shoulders above hips (stricter)
            const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
            const avgHipY = (leftHip.y + rightHip.y) / 2;
            const isSitting = avgShoulderY < avgHipY - 0.03;
            if (!isSitting) return 0;

            const getKneeAngle = (hip, knee, ankle) => {
                const angleRad = Math.atan2(ankle.y - knee.y, ankle.x - knee.x) -
                                 Math.atan2(hip.y - knee.y, hip.x - knee.x);
                let angleDeg = Math.abs(angleRad * 180 / Math.PI);
                if (angleDeg > 180) angleDeg = 360 - angleDeg;
                return angleDeg;
            };

            const visibilityOK = (p) => p && p.visibility > 0.5;

            // Score a single leg: combination of knee straightness and ankle lift
            const scoreLeg = (hip, knee, ankle) => {
                if (!visibilityOK(hip) || !visibilityOK(knee) || !visibilityOK(ankle)) return { score: 0, liftRatio: 0 };

                const kneeAngle = getKneeAngle(hip, knee, ankle); // 0-180, 180 = straight

                // Straightness score (closer to 180 is better)
                let straightness = 0;
                if (kneeAngle >= 160) straightness = 100;
                else if (kneeAngle >= 150) straightness = 90;
                else if (kneeAngle >= 140) straightness = 75;
                else if (kneeAngle >= 130) straightness = 60;
                else if (kneeAngle >= 110) straightness = 40;
                else straightness = 0;

                // Lift ratio: how high the ankle is relative to the knee, normalized by hip->knee distance
                const legLen = Math.max(0.01, Math.abs(hip.y - knee.y));
                const liftRatio = (knee.y - ankle.y) / legLen; // positive when ankle is above knee
                const liftScore = Math.min(Math.max(liftRatio * 100, 0), 100);

                // Combined score weights: straightness more important than lift
                const combined = Math.round(0.6 * straightness + 0.4 * liftScore);
                return { score: combined, liftRatio };
            };

            const left = scoreLeg(leftHip, leftKnee, leftAnkle);
            const right = scoreLeg(rightHip, rightKnee, rightAnkle);

            // If both legs are actively lifted (user lifted both), treat as invalid - require one leg at a time
            const activeThreshold = 0.25; // 25% of hip->knee distance
            const leftActive = left.liftRatio >= activeThreshold;
            const rightActive = right.liftRatio >= activeThreshold;
            if (leftActive && rightActive) return 0; // invalid - both legs acting

            // Return the higher single-leg score (only one should be active)
            return Math.min(Math.max(Math.max(left.score, right.score), 0), 100);
        }
    }
};

// Draw a simple skeleton outline for the 'none' character option
function drawBodyOutline(ctx, landmarks, canvasWidth, canvasHeight, accuracy) {
    if (!landmarks || landmarks.length === 0) return;

    const pts = landmarks.map(p => ({ x: p.x * canvasWidth, y: p.y * canvasHeight, v: p.visibility }));

    const connections = [
        [11,13],[13,15],[12,14],[14,16],
        [11,12],[23,24],[11,23],[12,24],
        [23,25],[25,27],[24,26],[26,28]
    ];

    ctx.save();
    ctx.lineWidth = 5;
    
    if (accuracy >= 80) ctx.strokeStyle = '#38ef7d';
    else if (accuracy > 50) ctx.strokeStyle = '#00f2fe';
    else ctx.strokeStyle = '#ffffff';

    connections.forEach(([a,b]) => {
        const p1 = pts[a];
        const p2 = pts[b];
        if (!p1 || !p2) return;
        if (p1.v < 0.4 || p2.v < 0.4) return;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    });

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!p || p.v < 0.4) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
        ctx.fill();
    }

    ctx.restore();
}

// Function to select character
function selectCharacter(charType) {
    currentCharacter = charType;
    document.querySelectorAll('.char-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const selectedButton = document.querySelector(`.char-btn[onclick*="${charType}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    updateMotivation(`🎭 ${characters[charType].name} selected! Ready to exercise!`);
}

// Function to select exercise
function selectExercise(exerciseType) {
    currentExercise = exerciseType;
    document.querySelectorAll('.exercise-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const selectedButton = document.querySelector(`.exercise-btn[onclick*="${exerciseType}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    updateMotivation(`✨ ${exercises[exerciseType].name} selected! Click Start when ready.`);
}

// Function to update score
function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = score;
    
    if (score > bestScore) {
        bestScore = score;
        document.getElementById('bestScore').textContent = bestScore;
    }
    
    level = Math.floor(score / 100) + 1;
    document.getElementById('level').textContent = level;
}

// Function to update reps
function updateReps() {
    reps++;
    document.getElementById('reps').textContent = reps;
    
    streak++;
    document.getElementById('streak').textContent = streak;

    checkConfetti();
}

// Function to update motivation message
function updateMotivation(message) {
    document.getElementById('motivation').textContent = message;
}

// Function to update accuracy bar
function updateAccuracy(accuracy) {
    const bar = document.getElementById('accuracyBar');
    const text = document.getElementById('accuracyText');
    bar.style.width = accuracy + '%';
    text.textContent = Math.round(accuracy) + '%';
    
    if (accuracy >= 100) {
        bar.style.background = 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)';
    } else if (accuracy >= 76) {
        bar.style.background = 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)';
    } else if (accuracy > 50) {
        bar.style.background = 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)';
    } else {
        bar.style.background = 'linear-gradient(90deg, #ff6b6b 0%, #ee5a6f 100%)';
    }
}

// Function to reset streak
function resetStreak() {
    streak = 0;
    document.getElementById('streak').textContent = streak;
}

// Function to draw cartoon character on body
function drawCharacterBody(ctx, landmarks, canvasWidth, canvasHeight, accuracy) {
    if (!landmarks || landmarks.length === 0) return;
    if (currentCharacter === 'none') {
        drawBodyOutline(ctx, landmarks, canvasWidth, canvasHeight, accuracy);
        return;
    }

    const char = characters[currentCharacter];
    
    const scale = (point) => ({
        x: point.x * canvasWidth,
        y: point.y * canvasHeight,
        visibility: point.visibility
    });

    const nose = scale(landmarks[0]);
    const leftShoulder = scale(landmarks[11]);
    const rightShoulder = scale(landmarks[12]);
    const leftElbow = scale(landmarks[13]);
    const rightElbow = scale(landmarks[14]);
    const leftWrist = scale(landmarks[15]);
    const rightWrist = scale(landmarks[16]);
    const leftHip = scale(landmarks[23]);
    const rightHip = scale(landmarks[24]);
    const leftKnee = scale(landmarks[25]);
    const rightKnee = scale(landmarks[26]);
    const leftAnkle = scale(landmarks[27]);
    const rightAnkle = scale(landmarks[28]);

    ctx.save();
    
    if (accuracy >= 100) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#38ef7d';
    } else if (accuracy >= 76) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f2fe';
    } else if (accuracy >= 50) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fee140';
    }

    // Draw cape if superhero
    if (char.cape && leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
        ctx.fillStyle = '#ff0000';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
        const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
        ctx.moveTo(shoulderMidX, shoulderMidY);
        ctx.lineTo(leftShoulder.x - 50, leftShoulder.y + 100);
        ctx.lineTo(leftShoulder.x - 30, shoulderMidY + 150);
        ctx.lineTo(shoulderMidX, shoulderMidY + 120);
        ctx.lineTo(rightShoulder.x + 30, shoulderMidY + 150);
        ctx.lineTo(rightShoulder.x + 50, leftShoulder.y + 100);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // Draw HEAD
    if (nose.visibility > 0.5) {
        const headRadius = 40;
        ctx.fillStyle = char.head.color;
        ctx.beginPath();
        ctx.arc(nose.x, nose.y, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = char.accent;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (currentCharacter === 'spiderman') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(nose.x - 15, nose.y - 5, 12, 18, -0.2, 0, Math.PI * 2);
            ctx.ellipse(nose.x + 15, nose.y - 5, 12, 18, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (currentCharacter === 'doraemon') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(nose.x, nose.y + 10, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(nose.x - 10, nose.y - 5, 8, 0, Math.PI * 2);
            ctx.arc(nose.x + 10, nose.y - 5, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(nose.x, nose.y + 5, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (currentCharacter === 'bheem') {
            ctx.fillStyle = '#000000';
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.arc(nose.x + i * 15, nose.y - 35, 12, 0, Math.PI);
                ctx.fill();
            }
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(nose.x - 12, nose.y - 5, 5, 0, Math.PI * 2);
            ctx.arc(nose.x + 12, nose.y - 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(nose.x, nose.y + 5, 15, 0, Math.PI);
            ctx.stroke();
        } else if (currentCharacter === 'superhero') {
            ctx.fillStyle = char.accent;
            ctx.beginPath();
            ctx.ellipse(nose.x - 15, nose.y - 3, 15, 10, 0, 0, Math.PI * 2);
            ctx.ellipse(nose.x + 15, nose.y - 3, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(nose.x - 12, nose.y - 3, 6, 0, Math.PI * 2);
            ctx.arc(nose.x + 12, nose.y - 3, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw BODY
    if (leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5 && 
        leftHip.visibility > 0.5 && rightHip.visibility > 0.5) {
        
        ctx.fillStyle = char.body.color;
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x, leftShoulder.y);
        ctx.lineTo(rightShoulder.x, rightShoulder.y);
        ctx.lineTo(rightHip.x, rightHip.y);
        ctx.lineTo(leftHip.x, leftHip.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = char.accent;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (currentCharacter === 'spiderman') {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            const torsoMidX = (leftShoulder.x + rightShoulder.x) / 2;
            const torsoMidY = (leftShoulder.y + leftHip.y) / 2;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(torsoMidX, torsoMidY, 15 + i * 15, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (currentCharacter === 'doraemon' && char.belly) {
            const bellyX = (leftShoulder.x + rightShoulder.x) / 2;
            const bellyY = (leftShoulder.y + leftHip.y) / 2 + 20;
            ctx.fillStyle = char.belly;
            ctx.beginPath();
            ctx.arc(bellyX, bellyY, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(bellyX, bellyY + 10, 20, 0, Math.PI);
            ctx.stroke();
        } else if (currentCharacter === 'bheem') {
            ctx.strokeStyle = char.accent;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(leftShoulder.x + 20, leftShoulder.y + 10);
            ctx.lineTo(rightShoulder.x - 20, rightShoulder.y + 10);
            ctx.stroke();
        } else if (currentCharacter === 'superhero') {
            const emblemX = (leftShoulder.x + rightShoulder.x) / 2;
            const emblemY = (leftShoulder.y + leftHip.y) / 2 - 10;
            ctx.fillStyle = char.accent;
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('S', emblemX, emblemY);
        }
    }

    // Draw LEFT ARM
    if (leftShoulder.visibility > 0.5 && leftElbow.visibility > 0.5 && leftWrist.visibility > 0.5) {
        drawLimb(ctx, leftShoulder, leftElbow, 20, char.arms.color, char.accent);
        drawLimb(ctx, leftElbow, leftWrist, 18, char.arms.color, char.accent);
        ctx.fillStyle = currentCharacter === 'spiderman' ? '#c41e3a' : 
                        currentCharacter === 'doraemon' ? '#4da6ff' : '#ffccaa';
        ctx.beginPath();
        ctx.arc(leftWrist.x, leftWrist.y, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw RIGHT ARM
    if (rightShoulder.visibility > 0.5 && rightElbow.visibility > 0.5 && rightWrist.visibility > 0.5) {
        drawLimb(ctx, rightShoulder, rightElbow, 20, char.arms.color, char.accent);
        drawLimb(ctx, rightElbow, rightWrist, 18, char.arms.color, char.accent);
        ctx.fillStyle = currentCharacter === 'spiderman' ? '#c41e3a' : 
                        currentCharacter === 'doraemon' ? '#4da6ff' : '#ffccaa';
        ctx.beginPath();
        ctx.arc(rightWrist.x, rightWrist.y, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw LEFT LEG
    if (leftHip.visibility > 0.5 && leftKnee.visibility > 0.5 && leftAnkle.visibility > 0.5) {
        drawLimb(ctx, leftHip, leftKnee, 22, char.legs.color, char.accent);
        drawLimb(ctx, leftKnee, leftAnkle, 20, char.legs.color, char.accent);
        ctx.fillStyle = char.legs.color;
        ctx.beginPath();
        ctx.ellipse(leftAnkle.x, leftAnkle.y, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = char.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw RIGHT LEG
    if (rightHip.visibility > 0.5 && rightKnee.visibility > 0.5 && rightAnkle.visibility > 0.5) {
        drawLimb(ctx, rightHip, rightKnee, 22, char.legs.color, char.accent);
        drawLimb(ctx, rightKnee, rightAnkle, 20, char.legs.color, char.accent);
        ctx.fillStyle = char.legs.color;
        ctx.beginPath();
        ctx.ellipse(rightAnkle.x, rightAnkle.y, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = char.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.restore();
}

// Helper function to draw limbs
function drawLimb(ctx, start, end, width, color, accentColor) {
    ctx.save();
    
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    
    ctx.translate(start.x, start.y);
    ctx.rotate(angle);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(0, -width/2, length, width, width/2);
    ctx.fill();
    
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
}

// Process pose detection results
function onResults(results) {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;
        
        let currentAccuracy = 0;
        if (isExercising) {
            const exercise = exercises[currentExercise];
            currentAccuracy = exercise.checkPose(landmarks);
            updateAccuracy(currentAccuracy);
            
            // NEW SCORING SYSTEM: Must achieve correct posture each time to score
            if (currentAccuracy >= 100 && canScorePoint) {
                perfectHoldTimer++;
                holdTimer = 0;
                // Require 2 seconds (60 frames at 30fps)
                if (perfectHoldTimer >= 60) {
                    updateScore(2);
                    updateReps();
                    const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
                    updateMotivation(`🏅 Perfect! +2 points – Now return to neutral position`);
                    perfectHoldTimer = 0;
                    canScorePoint = false; // Prevent scoring until posture is reset
                } else {
                    updateMotivation("💎 Hold the perfect pose for 2-3 seconds...");
                }
            } else if (currentAccuracy >= 76 && canScorePoint) {
                holdTimer++;
                perfectHoldTimer = 0;
                // Short hold (12 frames = ~0.4s)
                if (holdTimer >= 12) {
                    updateScore(1);
                    updateReps();
                    const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
                    updateMotivation(`✨ Good! +1 point – Now return to neutral position`);
                    holdTimer = 0;
                    canScorePoint = false; // Prevent scoring until posture is reset
                } else {
                    updateMotivation("👍 Good! Hold briefly to score 1 point...");
                }
            } else {
                holdTimer = 0;
                perfectHoldTimer = 0;
                // If accuracy drops below 50%, allow scoring again
                if (currentAccuracy < 50) {
                    canScorePoint = true;
                    updateMotivation("🎯 Ready for next pose! Match the target position!");
                } else {
                    updateMotivation("💪 Almost there! A bit more...");
                }
                resetStreak();
            }
        }
        
        drawCharacterBody(ctx, landmarks, canvas.width, canvas.height, currentAccuracy);
    }
    
    ctx.restore();
}

// Start exercise function
async function startExercise() {
    if (!pose) {
        updateMotivation("⏳ Loading AI model...");
        
        pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        
        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        pose.onResults(onResults);
        
        const video = document.getElementById('webcam');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            
            camera = new Camera(video, {
                onFrame: async () => {
                    await pose.send({image: video});
                },
                width: 1280,
                height: 720
            });
            
            camera.start();
            
            updateMotivation("✅ Camera ready! Perform the exercise now!");
            isExercising = true;
            document.querySelector('.start-btn').textContent = "Pause Exercise";
            showDemoForCurrentExercise();
        } catch (err) {
            updateMotivation("❌ Camera access denied. Please allow camera access.");
            console.error(err);
        }
    } else {
        isExercising = !isExercising;
        const startBtn = document.querySelector('.start-btn');
        if (isExercising) {
            updateMotivation("🏃 Exercise started! Match the pose!");
            startBtn.textContent = "Pause Exercise";
            showDemoForCurrentExercise();
        } else {
            updateMotivation("⏸️ Exercise paused. Click Start to resume.");
            startBtn.textContent = "Start Exercise";
            hideDemoPopup();
        }
    }
}

// Demo popup helpers
function getDemoVideoPath(exercise) {
    // Assumes demo video files are placed in the same folder as the app.
    // Update paths if your demo files live elsewhere.
    // Use the provided demo files in the project folder
    if (exercise === 'wrist') return 'elbow_demo.mp4';
    if (exercise === 'ankle') return 'leg_demo.mp4';
    return '';
}

function showDemoForCurrentExercise() {
    const popup = document.getElementById('demoPopup');
    const videoEl = document.getElementById('demoVideo');
    const titleEl = document.getElementById('demoTitle');
    const src = getDemoVideoPath(currentExercise);
    if (!src) return hideDemoPopup();

    titleEl.textContent = currentExercise === 'wrist' ? 'Elbow Exercise Demo' : 'Leg Exercise Demo';
    videoEl.src = src;
    videoEl.muted = true;
    videoEl.loop = true;
    videoEl.play().catch(() => {});
    popup.classList.add('show');
    popup.setAttribute('aria-hidden', 'false');
}

function hideDemoPopup() {
    const popup = document.getElementById('demoPopup');
    const videoEl = document.getElementById('demoVideo');
    if (videoEl) {
        try { videoEl.pause(); } catch (e) {}
        videoEl.removeAttribute('src');
        videoEl.load();
    }
    if (popup) {
        popup.classList.remove('show');
        popup.setAttribute('aria-hidden', 'true');
    }
}

// Close button hookup
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('demoClose');
    if (closeBtn) closeBtn.addEventListener('click', hideDemoPopup);
});

// Confetti logic
function checkConfetti() {
    if (streak >= CONFETTI_STREAK_TARGET) {
        updateMotivation(`🎉 ${CONFETTI_STREAK_TARGET} Streak! Amazing! 🎉`);
        triggerConfetti();
        streak = 0;
        document.getElementById('streak').textContent = streak;
    }
}

// Confetti animation
function triggerConfetti() {
    const confettiContainer = document.getElementById('confetti-container');
    if (confettiContainer) {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confettiContainer.appendChild(confetti);
        }
        setTimeout(() => {
            confettiContainer.innerHTML = '';
        }, 3000);
    }
}

// Modal functions
function openGuide() {
    document.getElementById('guideModal').style.display = 'block';
}

function closeGuide() {
    document.getElementById('guideModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('guideModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}