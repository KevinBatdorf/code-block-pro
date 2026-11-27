local M = {}

-- Merge two tables, right wins.
function M.merge(a, b)
	local out = {}
	for k, v in pairs(a) do out[k] = v end
	for k, v in pairs(b or {}) do out[k] = v end
	return out
end

return M
