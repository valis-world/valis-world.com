import re
import sys
import os
import json # Import the json module

def parse_rle(filepath):
    """Parses an RLE file and returns a list of live cell coordinate dicts."""
    # --- (Parsing logic remains the same as before) ---
    live_cells = []
    current_x = 0
    current_y = 0
    header_found = False
    width = 0
    height = 0
    try:
        filepath = filepath.strip().strip('"\'')
        with open(filepath, 'r') as f:
            data_lines = []
            for line in f:
                line = line.strip()
                if not line: continue
                if line.startswith('#'): continue
                if not header_found and line.startswith('x'):
                    match = re.match(r'x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)(?:\s*,\s*rule\s*=\s*([^\s]+))?', line, re.IGNORECASE)
                    if match:
                        width = int(match.group(1))
                        height = int(match.group(2))
                        rule = match.group(3)
                        print(f"--- RLE Header Found ---", file=sys.stderr)
                        print(f"Width: {width}, Height: {height}, Rule: {rule or 'Default (B3/S23 assumed)'}", file=sys.stderr)
                        print(f"------------------------", file=sys.stderr)
                        header_found = True
                    else:
                        print(f"Error: Malformed header line: {line}", file=sys.stderr)
                        return None
                elif header_found:
                    line_no_comments = re.sub(r'#.*', '', line)
                    data_lines.append(line_no_comments)
                else:
                     print(f"Warning: Skipping line before header: {line}", file=sys.stderr)

            if not header_found:
                print("Error: RLE header line (x = ..., y = ...) not found.", file=sys.stderr)
                return None

            full_data = "".join(data_lines).replace(" ", "").replace("\t", "").replace("\r", "").replace("\n", "")
            run_count_str = ''
            for char in full_data:
                if char.isdigit():
                    run_count_str += char
                else:
                    count = 1
                    if run_count_str:
                        try: count = int(run_count_str)
                        except ValueError:
                            print(f"Error: Invalid run count '{run_count_str}' in RLE data.", file=sys.stderr)
                            return None
                        run_count_str = ''
                    if char == 'b': current_x += count
                    elif char == 'o':
                        for i in range(count): live_cells.append({'x': current_x + i, 'y': current_y})
                        current_x += count
                    elif char == '$':
                        current_y += count
                        current_x = 0
                    elif char == '!': break
                    else: print(f"Warning: Unexpected character '{char}' in RLE data. Ignoring.", file=sys.stderr)
    except FileNotFoundError:
        print(f"Error: File not found at '{filepath}'.", file=sys.stderr)
        return None
    except ValueError as e:
         print(f"Error converting number: {e}.", file=sys.stderr)
         return None
    except Exception as e:
        print(f"An error occurred during parsing: {e}", file=sys.stderr)
        return None
    return live_cells
# --- (End of parsing logic) ---


# *** No longer formatting as JS array string ***

if __name__ == "__main__":
    rle_file_path = input("Please enter the path to the RLE file: ")
    if not rle_file_path:
        print("Error: No file path entered.", file=sys.stderr)
        sys.exit(1)

    rle_file_path = rle_file_path.strip().strip('"\'')
    print(f"\nParsing RLE file: {rle_file_path}...", file=sys.stderr)
    live_cells_list = parse_rle(rle_file_path)

    if live_cells_list is not None:
        print(f"Found {len(live_cells_list)} live cells.", file=sys.stderr)

        # --- Generate Output Filename (using .json) ---
        base_name = os.path.basename(rle_file_path)
        name_part, _ = os.path.splitext(base_name)
        # *** CHANGED EXTENSION TO .json ***
        output_filename = f"{name_part}_pattern.json"

        # --- Write to Output File as JSON ---
        try:
            with open(output_filename, 'w') as outfile:
                # *** Use json.dump() to write the list as JSON ***
                # indent=2 makes the JSON file human-readable (optional)
                json.dump(live_cells_list, outfile, indent=2)

            print(f"\nSuccessfully converted RLE.")
            print(f"Pattern data saved in JSON format to: ---> {output_filename} <---")
            print("Place this .json file where your web server can access it (e.g., alongside index.html).")

        except IOError as e:
            print(f"\nError: Could not write JSON to output file '{output_filename}'. Reason: {e}", file=sys.stderr)
            sys.exit(1)
        except TypeError as e:
             print(f"\nError: Could not serialize data to JSON. Reason: {e}", file=sys.stderr)
             sys.exit(1)

    else:
        print("\nConversion failed.", file=sys.stderr)
        sys.exit(1)
