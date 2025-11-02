import { useState, useEffect } from "react";
import { ApiService } from "../services/api-service";
import { Conversation, MessageData, MessageDocument } from "../types/type";

const MESSAGE_LIMIT = 20;

export function useChatSearch(
    conversationId: string | undefined,
    isSearchActive: boolean
) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isApiSearching, setIsApiSearching] = useState(false);
    const [searchApiResults, setSearchApiResults] = useState<MessageDocument[]>([]);
    const [searchPage, setSearchPage] = useState(1);
    const [searchHasMore, setSearchHasMore] = useState(false);
    const [totalSearchHits, setTotalSearchHits] = useState(0);

    // Effect chính để thực hiện tìm kiếm (có debounce)
    useEffect(() => {
        if (!isSearchActive || !conversationId || !searchQuery.trim()) {
            setSearchApiResults([]);
            setSearchPage(1);
            setSearchHasMore(false);
            setTotalSearchHits(0);
            return;
        }

        const debouncedSearch = setTimeout(async () => {
            setIsApiSearching(true);
            setSearchPage(1); // Luôn reset về page 1 khi có query mới
            try {
                const data = await ApiService.searchMessages(
                    searchQuery,
                    conversationId,
                    1,
                    MESSAGE_LIMIT
                );
                setSearchApiResults(data.hits);
                setTotalSearchHits(data.totalHits);
                setSearchHasMore(data.totalPages > data.currentPage);
            } catch (error) {
                console.error("Failed to search messages:", error);
            } finally {
                setIsApiSearching(false);
            }
        }, 300); // Debounce 300ms

        return () => clearTimeout(debouncedSearch);
    }, [searchQuery, isSearchActive, conversationId]);

    const handleLoadMoreSearch = async () => {
        if (!conversationId || isApiSearching || !searchHasMore) return;

        const nextPage = searchPage + 1;
        setIsApiSearching(true);
        try {
            const data = await ApiService.searchMessages(
                conversationId,
                searchQuery,
                nextPage,
                MESSAGE_LIMIT
            );
            setSearchApiResults((prev) => [...prev, ...data.hits]);
            setSearchPage(nextPage);
            setSearchHasMore(data.totalPages > data.currentPage);
        } catch (error) {
            console.error("Failed to load more search results:", error);
        } finally {
            setIsApiSearching(false);
        }
    };

    const closeSearch = () => {
        setSearchQuery("");
    };

    return {
        searchQuery,
        setSearchQuery,
        isApiSearching,
        searchApiResults,
        searchHasMore,
        totalSearchHits,
        handleLoadMoreSearch,
        closeSearch,
    };
}