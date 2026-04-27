"""
FastAPI application entry point with all tree CRUD routes.
"""

import json
from datetime import datetime, timezone
from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import Tree
from schemas import TreeCreate, TreeResponse

# ---------------------------------------------------------------------------
# App & middleware
# ---------------------------------------------------------------------------
app = FastAPI(title="AIMonk Tag Tree API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Create tables on startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _tree_to_response(tree: Tree) -> dict:
    """Convert a Tree ORM object to a response dict with parsed JSON."""
    return {
        "id": tree.id,
        "tree_json": json.loads(tree.tree_json),
        "created_at": tree.created_at,
        "updated_at": tree.updated_at,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/trees", response_model=List[TreeResponse])
def get_trees(db: Session = Depends(get_db)):
    """Return ALL saved tree records."""
    trees = db.query(Tree).order_by(Tree.id).all()
    return [_tree_to_response(t) for t in trees]


@app.post("/trees", response_model=TreeResponse, status_code=201)
def create_tree(payload: TreeCreate, db: Session = Depends(get_db)):
    """Save a NEW tree hierarchy."""
    new_tree = Tree(tree_json=json.dumps(payload.tree))
    db.add(new_tree)
    db.commit()
    db.refresh(new_tree)
    return _tree_to_response(new_tree)


@app.put("/trees/{tree_id}", response_model=TreeResponse)
def update_tree(tree_id: int, payload: TreeCreate, db: Session = Depends(get_db)):
    """Update an EXISTING tree hierarchy by ID."""
    tree = db.query(Tree).filter(Tree.id == tree_id).first()
    if not tree:
        raise HTTPException(status_code=404, detail="Tree not found")

    tree.tree_json = json.dumps(payload.tree)
    tree.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(tree)
    return _tree_to_response(tree)
