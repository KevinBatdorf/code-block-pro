SELECT p.ID, p.post_title, COUNT(c.comment_ID) AS comments
FROM wp_posts AS p
LEFT JOIN wp_comments AS c
	ON c.comment_post_ID = p.ID
	AND c.comment_approved = '1'
WHERE p.post_type = 'post'
	AND p.post_status = 'publish'
	AND p.post_date > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.ID, p.post_title
HAVING comments > 0
ORDER BY comments DESC, p.post_date DESC
LIMIT 20;
