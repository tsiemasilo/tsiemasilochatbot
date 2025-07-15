-- Tsie Masilo Bot - Database Queries
-- Copy and paste these queries into your database interface

-- 1. View all messages with user info
SELECT 
  id,
  user_name,
  content,
  is_user,
  mood,
  timestamp
FROM messages 
ORDER BY timestamp DESC;

-- 2. Count messages by user
SELECT 
  user_name,
  COUNT(*) as message_count
FROM messages 
GROUP BY user_name 
ORDER BY message_count DESC;

-- 3. Recent conversations (last 10 messages)
SELECT 
  user_name,
  content,
  is_user,
  timestamp
FROM messages 
ORDER BY timestamp DESC 
LIMIT 10;

-- 4. AI responses with mood analysis
SELECT 
  user_name,
  content,
  mood,
  timestamp
FROM messages 
WHERE is_user = false 
AND mood IS NOT NULL
ORDER BY timestamp DESC;

-- 5. User activity by day
SELECT 
  DATE(timestamp) as date,
  user_name,
  COUNT(*) as messages
FROM messages 
GROUP BY DATE(timestamp), user_name
ORDER BY date DESC, messages DESC;

-- 6. Voice messages (contain "Voice message")
SELECT 
  user_name,
  content,
  timestamp
FROM messages 
WHERE content LIKE '%Voice message%'
ORDER BY timestamp DESC;

-- 7. Database statistics
SELECT 
  'Total Messages' as metric,
  COUNT(*) as value
FROM messages
UNION ALL
SELECT 
  'Total Users' as metric,
  COUNT(DISTINCT user_name) as value
FROM messages
UNION ALL
SELECT 
  'AI Responses' as metric,
  COUNT(*) as value
FROM messages 
WHERE is_user = false;

-- 8. Clean up old test data (if needed)
-- DELETE FROM messages WHERE user_name = 'TestUser';
-- DELETE FROM messages WHERE content = 'test';