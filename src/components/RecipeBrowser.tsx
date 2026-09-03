import { useEffect, useState } from 'react'
import './RecipeBrowser.css'

type RecipeItem = {
  name?: string
  weight?: string
  group?: string
}

type Recipe = {
  shortDescription?: string
  img?: string
  title?: string
  preparationTime?: string
  preparationTotalTime?: string
  portions?: string
  items?: RecipeItem[]
  calories?: string | number
  carbohydrates?: string
  protein?: string
  fat?: string
  steps?: string[]
}

const DB_NAME = 'recipe-browser-db'
const DB_VERSION = 1
const STORE_NAME = 'recipes'

function openRecipesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Nie udało się otworzyć bazy IndexedDB'))
  })
}

async function saveRecipesToStorage(recipes: Recipe[]) {
  const db = await openRecipesDb()

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put({ id: 'recipes', value: recipes })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Nie udało się zapisać danych przepisu'))
    })
  } finally {
    db.close()
  }
}

async function loadRecipesFromStorage(): Promise<Recipe[]> {
  const db = await openRecipesDb()

  try {
    return await new Promise<Recipe[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get('recipes')

      request.onsuccess = () => {
        const result = request.result
        const recipes = Array.isArray(result?.value) ? result.value : []
        resolve(recipes)
      }

      request.onerror = () => reject(request.error ?? new Error('Nie udało się odczytać danych przepisu'))
    })
  } catch (error) {
    console.error('Nie udało się odczytać zapisanych przepisów z IndexedDB:', error)
    return []
  } finally {
    db.close()
  }
}

export default function RecipeBrowser() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selected, setSelected] = useState<Recipe | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    void (async () => {
      setRecipes(await loadRecipesFromStorage())
    })()
  }, [])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        await saveRecipesToStorage(parsed)
        setRecipes(parsed)
        setSelected(null)
        setQ('')
      }
    } catch (error) {
      console.error('Nie udało się odczytać pliku z przepisami:', error)
      setRecipes([])
      setSelected(null)
      setQ('')
    }
  }

  const filtered = recipes.filter((r) =>
    (r.title || '').toLowerCase().includes(q.toLowerCase())
  )

  function getImageSrc(orig: string | undefined) {
    return orig
  }

  return (
    <div className={`rb-root ${!selected ? 'list-full' : 'detail-full'}`}>
      {!selected ? (
        // List view (only)
        <div className="rb-sidebar">
          {!recipes.length && <div className="rb-upload-row">
            <label className="rb-file-label">
              <input type="file" accept=".js" onChange={handleFileChange} />
            </label>
          </div>}
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
              Powrót do listy
            </button>
            <br/><br/>
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
