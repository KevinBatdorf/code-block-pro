module Cache
  class Store
    def initialize
      @items = {}
      @mutex = Mutex.new
    end

    def fetch(key)
      @mutex.synchronize do
        @items.fetch(key) { |k| @items[k] = yield(k) }
      end
    end
  end
end
