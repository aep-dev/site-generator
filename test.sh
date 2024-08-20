#!/bin/bash

# Function to combine md and yaml files into a single file
combine_files() {
    local dir="$1"
    local md_j2_file="${dir}/aep.md.j2"
    local yaml_file="${dir}/aep.yaml"
    local md_file="${dir}/aep.md"

    echo $md_j2_file
    echo $yaml_file

    # Check if files exist
    if [ ! -f "$md_j2_file" ] || [ ! -f "$yaml_file" ]; then
        echo "Missing md or yaml file in $dir"
        return 1
    fi

    # Combine files with a separator
    cat "$yaml_file" <(echo "---") "$md_j2_file" > "$md_file"
}

# Loop over folders
for dir in */; do
    combine_files "$dir"
done
