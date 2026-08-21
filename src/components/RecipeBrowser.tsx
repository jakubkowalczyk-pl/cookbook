import { useEffect, useState } from 'react'
import recipesData from '../data_unique.js'
import './RecipeBrowser.css'

type Recipe = any

export default function RecipeBrowser() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selected, setSelected] = useState<Recipe | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    // data imported statically from data_unique.js (ES module)
    if (Array.isArray(recipesData)) setRecipes(recipesData)
  }, [])

  const filtered = recipes.filter((r) =>
    (r.title || '').toLowerCase().includes(q.toLowerCase())
  )

  function getImageSrc(orig: string | undefined) {
    if (!orig) return ''
    try {
      // try to extract numeric id from query param
      const m = orig.match(/[?&]id=(\d+)/)
      if (m && m[1]) {
        // when publicDir is `src`, assets are available under /assets
        return `/assets/recipes/${m[1]}.jpg`
      }
      return orig
    } catch (e) {
      return orig
    }
  }

  return (
    <div className={`rb-root ${!selected ? 'list-full' : 'detail-full'}`}>
      {!selected ? (
        // List view (only)
        <div className="rb-sidebar">
          <input
            className="rb-search"
            placeholder="Szukaj przepisu..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="rb-list">
            {filtered.map((r: Recipe, i: number) => (
              <li
                key={i}
                className="rb-item"
                onClick={() => setSelected(r)}
                role="button"
              >
                <img src={getImageSrc(r.img)} alt="" />
                <div className="rb-meta">
                  <div className="rb-title">{r.title}</div>
                  <div className="rb-short">{r.shortDescription}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        // Detail view (only) with back button
        <div className="rb-content">
          <article>
            <button className="rb-back" onClick={() => setSelected(null)}>
              ← Powrót do listy
            </button>
            <h2>{selected.title}</h2>
            {selected.img && (
              <img className="rb-hero" src={getImageSrc(selected.img)} alt={selected.title} />
            )}
            <div className="rb-meta-row">
              <span>
                <strong>Czas przygotowania:</strong>{' '}
                {selected.preparationTime || ''}
              </span>
              <span>
                <strong>Czas całkowity:</strong>{' '}
                {selected.preparationTotalTime || ''}
              </span>
              <span>
                <strong>Porcje:</strong>{' '}
                {selected.portions || ''}
              </span>
            </div>

            <div className="rb-nutrition">
              <strong>Wartości odżywcze:</strong>
              <ul>
                <li>
                  <strong>Kalorie:</strong>{' '}
                  {selected.calories ? String(selected.calories).trim() : '-'}
                </li>
                <li>
                  <strong>Węglowodany:</strong>{' '}
                  {selected.carbohydrates ? String(selected.carbohydrates).trim() : '-'}
                </li>
                <li>
                  <strong>Białko:</strong>{' '}
                  {selected.protein ? String(selected.protein).trim() : '-'}
                </li>
                <li>
                  <strong>Tłuszcz:</strong>{' '}
                  {selected.fat ? String(selected.fat).trim() : '-'}
                </li>
              </ul>
            </div>

            <h3>Składniki</h3>
            <ul>
              {Array.isArray(selected.items) &&
                selected.items.map((it: any, idx: number) => (
                  <li key={idx}>
                    {it.name} {it.weight ? `— ${it.weight}` : ''}
                  </li>
                ))}
            </ul>

            <h3>Przygotowanie</h3>
            <ol>
              {Array.isArray(selected.steps) &&
                selected.steps.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
            </ol>
          </article>
        </div>
      )}
    </div>
  )
}
