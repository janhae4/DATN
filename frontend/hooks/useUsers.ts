import { useQuery } from "@tanstack/react-query";
import { userService, SearchUsersParams } from "../services/userService";
import { useState, useEffect } from "react";

function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export const useSearchUsers = (params: SearchUsersParams) => {
    const debouncedQuery = useDebounceValue(params.query, 500);

    return useQuery({
        queryKey: ["users", "search", debouncedQuery, params.page, params.limit, params.teamId],
        queryFn: () => userService.searchUsers({ ...params, query: debouncedQuery }),
        enabled: debouncedQuery.length > 0,
    });
};
