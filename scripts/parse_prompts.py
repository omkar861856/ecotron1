import re
# import psycopg2

def parse_prompts(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Regex to find prompt blocks
    # Looking for ### No. X: Title ... #### 📝 Prompt ... ```prompt```
    blocks = re.split(r'---', content)
    prompts = []

    for block in blocks:
        title_match = re.search(r'### No\.\s*\d+:\s*(.+)', block)
        prompt_match = re.search(r'#### 📝 Prompt\s+```\s*(.*?)\s*```', block, re.DOTALL)
        author_match = re.search(r'\*\*Author:\*\* \[(.*?)\]', block)
        
        if title_match and prompt_match:
            title = title_match.group(1).strip()
            content_text = prompt_match.group(1).strip()
            author = author_match.group(1).strip() if author_match else "Community"
            
            # Simple category detection from title
            category = "general"
            if "Resume" in title: category = "resume"
            elif "Email" in title: category = "email"
            elif "Summar" in title: category = "summarize"
            elif "Photo" in title or "Image" in title: category = "creative"
            
            prompts.append((title, content_text, category, author))
    
    return prompts

def seed_db(prompts):
    conn = psycopg2.connect("postgresql://ecotron:ecotron_pass@localhost:5432/ecotron_db")
    cur = conn.cursor()
    
    try:
        for p in prompts:
            cur.execute(
                "INSERT INTO prompts (title, content, category, author) VALUES (%s, %s, %s, %s)",
                p
            )
        conn.commit()
        print(f"Successfully seeded {len(prompts)} prompts!")
    except Exception as e:
        print(f"Error seeding: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    data = parse_prompts('/tmp/prompts/README.md')
    print(f"Found {len(data)} prompts. Starting seed...")
    # Note: On local, we need to handle the DB connection. 
    # I'll output a SQL file instead for the user to run inside the docker container.
    with open('/tmp/prompts/mega-seed.sql', 'w') as f:
        for p in data:
            title = p[0].replace("'", "''")
            content = p[1].replace("'", "''")
            f.write(f"INSERT INTO prompts (title, content, category, author) VALUES ('{title}', '{content}', '{p[2]}', '{p[3]}');\n")
