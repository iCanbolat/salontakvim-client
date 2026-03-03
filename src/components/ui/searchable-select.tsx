import * as React from "react";
import { useInView } from "react-intersection-observer";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  mode?: "server" | "client";
  options: SearchableSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  onSearchChange?: (search: string) => void;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
  isSearching?: boolean;
  pageSize?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  mode = "server",
  options,
  value,
  onValueChange,
  onSearchChange,
  onLoadMore,
  hasNextPage = false,
  isLoading = false,
  isSearching = false,
  pageSize = 1,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const [clientPage, setClientPage] = React.useState(1);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const { ref, inView } = useInView({
    threshold: 0,
  });

  const filteredClientOptions = React.useMemo(() => {
    if (mode !== "client") {
      return options;
    }

    const normalizedSearch = searchText.trim().toLowerCase();
    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) => {
      const label = option.label.toLowerCase();
      const description = option.description?.toLowerCase() ?? "";
      return (
        label.includes(normalizedSearch) ||
        description.includes(normalizedSearch)
      );
    });
  }, [mode, options, searchText]);

  const visibleOptions = React.useMemo(() => {
    if (mode === "client") {
      return filteredClientOptions.slice(0, clientPage * pageSize);
    }
    return options;
  }, [clientPage, filteredClientOptions, mode, options, pageSize]);

  const resolvedHasNextPage =
    mode === "client"
      ? visibleOptions.length < filteredClientOptions.length
      : hasNextPage;

  const resolvedIsLoading = mode === "client" ? false : isLoading;
  const resolvedIsSearching = mode === "client" ? false : isSearching;

  // Fetch more when the end of the list is in view
  React.useEffect(() => {
    if (
      !inView ||
      !resolvedHasNextPage ||
      resolvedIsLoading ||
      resolvedIsSearching
    ) {
      return;
    }

    if (mode === "client") {
      setClientPage((prev) => prev + 1);
      return;
    }

    if (onLoadMore) {
      onLoadMore();
    }
  }, [
    inView,
    mode,
    onLoadMore,
    resolvedHasNextPage,
    resolvedIsLoading,
    resolvedIsSearching,
  ]);

  React.useEffect(() => {
    setClientPage(1);
  }, [searchText, mode]);

  const handleSearchChange = (nextValue: string) => {
    setSearchText(nextValue);
    onSearchChange?.(nextValue);
  };

  const clearSearch = () => {
    handleSearchChange("");
  };

  const handleListWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    const container = listRef.current;
    if (!container) {
      return;
    }

    container.scrollTop += event.deltaY;
    event.preventDefault();
    event.stopPropagation();
  };

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchText.length > 0 && (
              <button
                type="button"
                onClick={clearSearch}
                className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {resolvedIsSearching && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
            )}
          </div>
          <CommandList
            ref={listRef}
            className="max-h-[200px] overflow-y-auto"
            onWheel={handleListWheel}
          >
            {visibleOptions.length === 0 &&
              !resolvedIsLoading &&
              !resolvedIsSearching && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              {visibleOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className="flex items-center py-2"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium truncate">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          • {option.description}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {(resolvedHasNextPage ||
              resolvedIsLoading ||
              resolvedIsSearching) && (
              <div ref={ref} className="flex items-center justify-center p-4">
                {(resolvedIsLoading || resolvedIsSearching) && (
                  <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                )}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
