db = db.getSiblingDB('boiskopro');

db.createCollection('users');
db.createCollection('reviews');
db.createCollection('activity_logs');

db.users.createIndex({ email: 1 }, { unique: true });
db.reviews.createIndex({ productId: 1 });
db.reviews.createIndex({ userId: 1 });
db.activity_logs.createIndex({ createdAt: -1 });
db.activity_logs.createIndex({ userId: 1 });
