import csv
import re
import sys

csv.field_size_limit(sys.maxsize)

def parse_csv_prompts(file_path):
    prompts = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('act', 'Untitled Prompt')
            content = row.get('prompt', '')
            if title and content:
                prompts.append((title, content, 'chatgpt', 'Prompts.chat'))
    return prompts

def generate_sql(prompts, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        for p in prompts:
            title = p[0].replace("'", "''")
            content = p[1].replace("'", "''")
            f.write(f"INSERT INTO prompts (title, content, category, author) VALUES ('{title}', '{content}', '{p[2]}', '{p[3]}');\n")

if __name__ == "__main__":
    # 1. Parse CSV
    print("Parsing ChatGPT Prompts...")
    chatgpt_data = parse_csv_prompts('./chatgpt-prompts/prompts.csv')
    print(f"Found {len(chatgpt_data)} ChatGPT prompts.")

    # 2. Generate SQL
    generate_sql(chatgpt_data, './scripts/chatgpt-seed.sql')
    print(f"Generated SQL seed file: ./scripts/chatgpt-seed.sql")
