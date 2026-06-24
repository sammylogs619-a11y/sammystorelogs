import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCountries } from '../../hooks/useForeignNumbers';

export function ForeignNumbersNavItem() {
  const [isOpen, setIsOpen] = useState(false);
  const { countries, loading } = useCountries();
  const location = useLocation();

  const isForeignNumbersRoute = location.pathname.startsWith('/foreign-numbers');

  return (
    <div className="mt-1">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 rounded-lg
          text-sm font-medium transition-colors duration-150
          ${isForeignNumbersRoute
            ? 'bg-primary/10 text-primary'
            : 'text-foreground/70 hover:text-foreground hover:bg-muted'}
        `}
      >
        <span className="flex items-center gap-2.5">
          <span className="text-base">🌍</span>
          <span>Shop Foreign Numbers</span>
        </span>
        {isOpen
          ? <ChevronDown className="w-4 h-4 opacity-60" />
          : <ChevronRight className="w-4 h-4 opacity-60" />
        }
      </button>

      {isOpen && (
        <div className="mt-1 ml-3 pl-3 border-l border-border space-y-0.5 max-h-72 overflow-y-auto">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 rounded-md bg-muted animate-pulse mx-1 my-0.5" />
              ))
            : countries.map(country => {
                const countrySlug = country.name.toLowerCase().replace(/\s+/g, '-');
                const isActive = location.pathname === `/foreign-numbers/${countrySlug}`;
                return (
                  <Link
                    key={country.code}
                    to={`/foreign-numbers/${countrySlug}`}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded-md text-sm
                      transition-colors duration-150
                      ${isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground/60 hover:text-foreground hover:bg-muted'}
                    `}
                  >
                    <span className="text-base leading-none">{country.flag_emoji}</span>
                    <span className="truncate">{country.name}</span>
                  </Link>
                );
              })
          }
        </div>
      )}
    </div>
  );
}
